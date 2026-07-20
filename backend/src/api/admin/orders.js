// backend/src/api/admin/orders.js

const express = require('express')
const { Op } = require('sequelize')
const auth = require('../../middleware/auth')
const { RechargeOrder, UnlockRecord, User, Article } = require('../../models')

const router = express.Router()

// ============================================================
// 充值订单列表（修复版）
// ============================================================
router.get('/recharge', auth, async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 20 } = req.query
    
    const where = {}
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }
    
    // ✅ 使用 include 关联 User
    const { rows, count } = await RechargeOrder.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          attributes: ['id', 'nickname', 'phone'] 
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    })
    
    // 格式化数据
    const list = rows.map(row => ({
      id: row.id,
      order_no: row.order_no,
      user_id: row.user_id,
      user_nickname: row.User?.nickname || '未知用户',
      user_phone: row.User?.phone || '',
      amount: parseFloat(row.amount),
      points_gained: row.points_gained,
      status: row.status,
      paid_at: row.paid_at,
      created_at: row.created_at
    }))
    
    res.json({
      code: 0,
      data: {
        list,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
    
  } catch (error) {
    console.error('获取充值订单失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: error.message || '获取订单失败' 
    })
  }
})

// ============================================================
// 付费订单列表
// ============================================================
router.get('/pay', auth, async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query
    
    const where = {}
    if (keyword) {
      where['$Article.title$'] = { [Op.like]: `%${keyword}%` }
    }
    
    const { rows, count } = await UnlockRecord.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          attributes: ['id', 'nickname', 'phone'] 
        },
        { 
          model: Article, 
          attributes: ['id', 'title'] 
        }
      ],
      order: [['unlocked_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    })
    
    const list = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_nickname: row.User?.nickname || '未知用户',
      article_id: row.article_id,
      article_title: row.Article?.title || '未知内容',
      points_cost: row.points_cost,
      unlocked_at: row.unlocked_at
    }))
    
    res.json({
      code: 0,
      data: {
        list,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
    
  } catch (error) {
    console.error('获取付费订单失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: error.message || '获取订单失败' 
    })
  }
})

module.exports = router