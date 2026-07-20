// backend/src/api/email.js

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { sendVerificationCode } = require('../utils/email')
const { User } = require('../models')
const config = require('../config')
const router = express.Router()

// 验证码存储（生产环境使用 Redis）
const codeStore = {}

// ============================================================
// 生成6位验证码
// ============================================================
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ============================================================
// 发送邮箱验证码
// ============================================================
router.post('/send-code', async (req, res) => {
  try {
    const { email, type = 'login' } = req.body
    
    console.log('📧 发送验证码请求:', email, type)
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 1, message: '请输入正确的邮箱地址' })
    }
    
    // 检查发送频率（60秒限制）
    const lastSend = codeStore[email]?.lastSendTime
    if (lastSend && Date.now() - lastSend < 60000) {
      return res.status(400).json({ 
        code: 1, 
        message: '发送过于频繁，请等待60秒后再试' 
      })
    }
    
    // 生成并存储验证码
    const code = generateCode()
    codeStore[email] = {
      code: code,
      type: type,
      expires: Date.now() + 5 * 60 * 1000,
      lastSendTime: Date.now()
    }
    
    console.log('✅ 验证码生成:', email, code)
    
    // 发送邮件
    await sendVerificationCode(email, code, type)
    
    // 开发环境返回验证码
    const responseData = process.env.NODE_ENV === 'development' ? { code } : {}
    
    res.json({
      code: 0,
      message: '验证码已发送至您的邮箱',
      data: responseData
    })
    
  } catch (error) {
    console.error('❌ 发送验证码失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '发送失败，请检查邮箱地址或稍后重试' 
    })
  }
})

// ============================================================
// 邮箱验证码登录（首次自动注册）
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, code } = req.body
    
    console.log('🔐 验证码登录请求:', email, code)
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 1, message: '请输入正确的邮箱地址' })
    }
    
    // 验证验证码
    const stored = codeStore[email]
    if (!stored) {
      return res.status(400).json({ code: 1, message: '请先获取验证码' })
    }
    if (stored.code !== code) {
      return res.status(400).json({ code: 1, message: '验证码错误' })
    }
    if (Date.now() > stored.expires) {
      delete codeStore[email]
      return res.status(400).json({ code: 1, message: '验证码已过期' })
    }
    
    // 查找或创建用户
    let user = await User.findOne({ where: { email } })
    let isNewUser = false
    
    if (!user) {
      isNewUser = true
      user = await User.create({
        email: email,
        nickname: email.split('@')[0],
        points: 100,
        status: 1,
        has_password: 0
      })
      console.log('✅ 新用户自动注册:', user.id, email)
    }
    
    // 清除验证码
    delete codeStore[email]
    
    // 生成 Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        isNewUser,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          points: user.points,
          hasPassword: user.has_password === 1
        }
      }
    })
    
  } catch (error) {
    console.error('❌ 验证码登录失败:', error)
    res.status(500).json({ code: 1, message: '登录失败' })
  }
})

// ============================================================
// 邮箱密码登录
// ============================================================
router.post('/password-login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    console.log('🔐 密码登录请求:', email)
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 1, message: '请输入正确的邮箱地址' })
    }
    
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(400).json({ code: 1, message: '用户不存在' })
    }
    
    if (!user.password || user.has_password !== 1) {
      return res.status(400).json({ code: 1, message: '该账号未设置密码，请使用验证码登录' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(400).json({ code: 1, message: '密码错误' })
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          points: user.points,
          hasPassword: true
        }
      }
    })
    
  } catch (error) {
    console.error('❌ 密码登录失败:', error)
    res.status(500).json({ code: 1, message: '登录失败' })
  }
})

// ============================================================
// 设置密码
// ============================================================
router.post('/set-password', async (req, res) => {
  try {
    const { email, code, password } = req.body
    
    console.log('🔑 设置密码请求:', email)
    
    if (!password || password.length < 6) {
      return res.status(400).json({ code: 1, message: '密码至少6位' })
    }
    
    const stored = codeStore[email]
    if (!stored) {
      return res.status(400).json({ code: 1, message: '请先获取验证码' })
    }
    if (stored.code !== code) {
      return res.status(400).json({ code: 1, message: '验证码错误' })
    }
    if (Date.now() > stored.expires) {
      delete codeStore[email]
      return res.status(400).json({ code: 1, message: '验证码已过期' })
    }
    
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(400).json({ code: 1, message: '用户不存在' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    user.has_password = 1
    await user.save()
    
    delete codeStore[email]
    
    res.json({
      code: 0,
      message: '密码设置成功'
    })
    
  } catch (error) {
    console.error('❌ 设置密码失败:', error)
    res.status(500).json({ code: 1, message: '设置失败' })
  }
})

module.exports = router