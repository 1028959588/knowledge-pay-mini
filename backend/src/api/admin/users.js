const express = require('express')
const { Op } = require('sequelize')
const auth = require('../../middleware/auth')
const { User, PointsRecord } = require('../../models')

const router = express.Router()

// ============================================================
// 用户列表
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const { keyword, status, page = 1, limit = 20 } = req.query
    
    const where = {}
    if (keyword) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }
    
    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'nickname', 'avatar', 'phone', 'points', 'status', 'created_at'],
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
    console.error('获取用户列表失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取用户详情
// ============================================================
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'nickname', 'avatar', 'phone', 'points', 'status', 'created_at', 'updated_at']
    })
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    res.json({ code: 0, data: user })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 禁用/启用用户
// ============================================================
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    user.status = status
    await user.save()
    
    res.json({
      code: 0,
      message: status === 1 ? '用户已启用' : '用户已禁用'
    })
  } catch (error) {
    console.error('更新用户状态失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 调整积分
// ============================================================
router.put('/:id/points', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    user.points += parseInt(amount)
    await user.save()
    
    await PointsRecord.create({
      user_id: user.id,
      amount: parseInt(amount),
      type: 'admin',
      description: reason || `管理员调整 ${amount > 0 ? '+' : ''}${amount} 积分`
    })
    
    res.json({
      code: 0,
      message: '积分调整成功',
      data: { points: user.points }
    })
  } catch (error) {
    console.error('调整积分失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

module.exports = router