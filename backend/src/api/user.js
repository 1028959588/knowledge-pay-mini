const express = require('express')
const auth = require('../middleware/auth')
const { User } = require('../models')

const router = express.Router()

// ============================================================
// 获取用户信息
// ============================================================
// backend/src/api/user.js

// 获取用户信息
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nickname', 'avatar', 'phone', 'email', 'points', 'status', 'has_password', 'created_at']
    })
    
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    res.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email || '',
        points: user.points,
        status: user.status,
        hasPassword: user.has_password === 1,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 更新用户信息
// ============================================================
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, avatar } = req.body
    const userId = req.user.id
    
    console.log('=== 更新用户信息 ===')
    console.log('用户ID:', userId)
    console.log('昵称:', nickname)
    console.log('头像:', avatar)
    
    // 查找用户
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    // 更新字段
    if (nickname !== undefined && nickname.trim()) {
      user.nickname = nickname.trim()
    }
    if (avatar !== undefined) {
      user.avatar = avatar
    }
    
    // 保存到数据库
    await user.save()
    
    console.log('用户信息更新成功:', {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar
    })
    
    // 返回更新后的用户信息
    res.json({
      code: 0,
      message: '更新成功',
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        points: user.points
      }
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 绑定手机号
// ============================================================
router.post('/bind-phone', auth, async (req, res) => {
  try {
    const { phone, code } = req.body
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: '请输入正确的手机号' })
    }
    
    // 验证验证码（开发环境跳过）
    // TODO: 生产环境启用验证码验证
    
    const existUser = await User.findOne({ where: { phone } })
    if (existUser && existUser.id !== req.user.id) {
      return res.status(400).json({ code: 1, message: '手机号已被其他账号绑定' })
    }
    
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    user.phone = phone
    await user.save()
    
    res.json({
      code: 0,
      message: '绑定成功',
      data: { phone }
    })
  } catch (error) {
    console.error('绑定手机失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 修改密码
// ============================================================
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    
    if (!user.password) {
      return res.status(400).json({ code: 1, message: '该账号未设置密码，请使用验证码登录' })
    }
    
    const { verifyPassword, hashPassword } = require('../utils/crypto')
    const isValid = await verifyPassword(oldPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ code: 1, message: '当前密码错误' })
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ code: 1, message: '新密码至少6位' })
    }
    
    user.password = await hashPassword(newPassword)
    await user.save()
    
    res.json({ code: 0, message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

module.exports = router