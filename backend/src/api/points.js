const express = require('express')
const { Op } = require('sequelize')
const auth = require('../middleware/auth')
const { User, PointsRecord, RechargeOrder } = require('../models')
const { generateOrderNo } = require('../utils/crypto')

const router = express.Router()

// ============================================================
// 获取积分余额
// ============================================================
router.get('/points/balance', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['points']
    })
    res.json({ code: 0, data: { points: user.points } })
  } catch (error) {
    console.error('获取积分失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取积分记录
// ============================================================
router.get('/points/records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query
    const offset = (page - 1) * limit
    
    const where = { user_id: req.user.id }
    if (type === 'income') {
      where.amount = { [Op.gt]: 0 }
    } else if (type === 'expense') {
      where.amount = { [Op.lt]: 0 }
    }
    
    const { rows, count } = await PointsRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    
    // 计算统计
    const totalIncome = await PointsRecord.sum('amount', {
      where: { user_id: req.user.id, amount: { [Op.gt]: 0 } }
    })
    const totalExpense = await PointsRecord.sum('amount', {
      where: { user_id: req.user.id, amount: { [Op.lt]: 0 } }
    })
    
    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalIncome: totalIncome || 0,
        totalExpense: Math.abs(totalExpense || 0)
      }
    })
  } catch (error) {
    console.error('获取积分记录失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 创建充值订单
// ============================================================
router.post('/recharge/create', auth, async (req, res) => {
  try {
    const { amount } = req.body
    
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ code: 1, message: '请输入正确金额' })
    }
    
    // 获取积分汇率
    const { Setting } = require('../models')
    const setting = await Setting.findOne({ where: { key: 'exchange_rate' } })
    const rate = setting ? parseInt(setting.value) : 10
    
    const points = Math.floor(amountNum * rate)
    
    const order = await RechargeOrder.create({
      user_id: req.user.id,
      order_no: generateOrderNo(),
      amount: amountNum,
      points_gained: points,
      status: 0
    })
    
    // TODO: 这里对接微信支付
    // 开发环境直接模拟支付成功
    
    res.json({
      code: 0,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        amount: order.amount,
        points: order.points_gained,
        status: order.status
      }
    })
  } catch (error) {
    console.error('创建充值订单失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 支付充值订单（模拟）
// ============================================================
router.post('/recharge/pay', auth, async (req, res) => {
  try {
    const { orderId } = req.body
    
    const order = await RechargeOrder.findOne({
      where: { id: orderId, user_id: req.user.id }
    })
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' })
    }
    if (order.status === 1) {
      return res.status(400).json({ code: 1, message: '订单已支付' })
    }
    if (order.status === 2) {
      return res.status(400).json({ code: 1, message: '订单已取消' })
    }
    
    // 更新订单状态
    order.status = 1
    order.paid_at = new Date()
    await order.save()
    
    // 增加积分
    const user = await User.findByPk(req.user.id)
    user.points += order.points_gained
    await user.save()
    
    // 记录积分变动
    const { PointsRecord } = require('../models')
    await PointsRecord.create({
      user_id: req.user.id,
      amount: order.points_gained,
      type: 'recharge',
      description: `充值 ¥${order.amount} 获得 ${order.points_gained} 积分`
    })
    
    res.json({
      code: 0,
      message: '支付成功',
      data: {
        points: user.points,
        gained: order.points_gained
      }
    })
  } catch (error) {
    console.error('支付失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取充值记录
// ============================================================
router.get('/recharge/records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const { rows, count } = await RechargeOrder.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    })
    
    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('获取充值记录失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

module.exports = router