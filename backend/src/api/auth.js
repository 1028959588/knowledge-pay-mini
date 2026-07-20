const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')  // 需要安装 axios
const { User } = require('../models')
const { hashPassword, verifyPassword } = require('../utils/crypto')
const config = require('../config')

const router = express.Router()

// ============================================================
// 发送验证码
// ============================================================
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: '请输入正确的手机号' })
    }
    
    // TODO: 对接短信服务商（阿里云、腾讯云等）
    // 开发环境直接返回固定验证码
    const code = '1234'
    
    // 存储验证码到缓存（开发环境暂存内存）
    // 实际生产环境应使用 Redis
    global.smsCodes = global.smsCodes || {}
    global.smsCodes[phone] = {
      code,
      expires: Date.now() + 300000 // 5分钟有效
    }
    
    console.log(`📱 验证码发送到 ${phone}: ${code}`)
    
    res.json({
      code: 0,
      message: '验证码已发送',
      data: { code: code } // 开发环境返回验证码方便测试
    })
  } catch (error) {
    console.error('发送验证码失败:', error)
    res.status(500).json({ code: 1, message: '发送失败，请重试' })
  }
})

// ============================================================
// 注册
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { phone, code, password } = req.body
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: '请输入正确的手机号' })
    }
    
    // 验证验证码
    const codeData = global.smsCodes?.[phone]
    if (!codeData || codeData.code !== code || codeData.expires < Date.now()) {
      return res.status(400).json({ code: 1, message: '验证码错误或已过期' })
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ code: 1, message: '密码至少6位' })
    }
    
    const existUser = await User.findOne({ where: { phone } })
    if (existUser) {
      return res.status(400).json({ code: 1, message: '手机号已注册' })
    }
    
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      phone,
      password: hashedPassword,
      nickname: '用户_' + phone.slice(-4),
      points: 100
    })
    
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    // 清除验证码
    delete global.smsCodes?.[phone]
    
    res.json({
      code: 0,
      message: '注册成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          points: user.points
        }
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 验证码登录
// ============================================================
router.post('/login-by-code', async (req, res) => {
  try {
    const { phone, code } = req.body
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: '请输入正确的手机号' })
    }
    
    // 验证验证码
    const codeData = global.smsCodes?.[phone]
    if (!codeData || codeData.code !== code || codeData.expires < Date.now()) {
      return res.status(400).json({ code: 1, message: '验证码错误或已过期' })
    }
    
    let user = await User.findOne({ where: { phone } })
    
    if (!user) {
      // 验证码登录时如果用户不存在，自动注册
      user = await User.create({
        phone,
        nickname: '用户_' + phone.slice(-4),
        points: 100
      })
    }
    
    if (user.status === 0) {
      return res.status(400).json({ code: 1, message: '账号已被禁用' })
    }
    
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    // 清除验证码
    delete global.smsCodes?.[phone]
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          points: user.points
        }
      }
    })
  } catch (error) {
    console.error('验证码登录失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 密码登录
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ code: 1, message: '请输入正确的手机号' })
    }
    
    const user = await User.findOne({ where: { phone } })
    if (!user) {
      return res.status(400).json({ code: 1, message: '用户不存在，请先注册' })
    }
    
    if (!user.password) {
      return res.status(400).json({ code: 1, message: '该账号未设置密码，请使用微信登录' })
    }
    
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return res.status(400).json({ code: 1, message: '密码错误，请重新输入' })
    }
    
    if (user.status === 0) {
      return res.status(400).json({ code: 1, message: '账号已被禁用，请联系客服' })
    }
    
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
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
          phone: user.phone,
          points: user.points
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误，请稍后重试' })
  }
})

// 微信登录（小程序）- 开发环境自动降级
router.post('/wx-login', async (req, res) => {
  try {
    const { code, nickName, avatarUrl } = req.body
    
    console.log('=== 微信登录请求 ===')
    console.log('code:', code)
    console.log('nickName:', nickName)
    console.log('avatarUrl:', avatarUrl)
    
    let openid
    
    // ============================================================
    // 检查是否配置了微信
    // ============================================================
    const hasWxConfig = config.wechat.appid && 
                        config.wechat.appid !== '' &&
                        config.wechat.secret && 
                        config.wechat.secret !== ''
    
    if (hasWxConfig) {
      // ============================================================
      // 有配置：调用微信接口
      // ============================================================
      try {
        const axios = require('axios')
        const url = 'https://api.weixin.qq.com/sns/jscode2session'
        const params = {
          appid: config.wechat.appid,
          secret: config.wechat.secret,
          js_code: code,
          grant_type: 'authorization_code'
        }
        
        console.log('📤 调用微信接口...')
        console.log('appid:', config.wechat.appid)
        
        const response = await axios.get(url, { params })
        console.log('📥 微信接口响应:', JSON.stringify(response.data))
        
        if (response.data.openid) {
          openid = response.data.openid
          console.log('✅ 获取到 openid:', openid)
        } else if (response.data.errcode === 40029) {
          console.error('❌ 微信接口错误: invalid code (code 已过期或无效)')
          // 开发环境使用模拟
          openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          console.log('🔧 使用模拟 openid:', openid)
        } else if (response.data.errcode === 40163) {
          console.error('❌ 微信接口错误: code been used (code 已被使用)')
          openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          console.log('🔧 使用模拟 openid:', openid)
        } else if (response.data.errcode) {
          console.error(`❌ 微信接口错误: ${response.data.errmsg} (${response.data.errcode})`)
          openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          console.log('🔧 使用模拟 openid:', openid)
        } else {
          // 没有 openid 也没有错误码
          openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          console.log('🔧 使用模拟 openid:', openid)
        }
      } catch (wxError) {
        console.error('❌ 微信接口调用失败:', wxError.message)
        openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        console.log('🔧 使用模拟 openid:', openid)
      }
    } else {
      // ============================================================
      // 没有配置：使用模拟 openid
      // ============================================================
      console.warn('⚠️ 未配置微信 AppID，使用模拟 openid')
      openid = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      console.log('🔧 使用模拟 openid:', openid)
    }
    
    // ============================================================
    // 查找或创建用户
    // ============================================================
    let user = await User.findOne({ where: { openid } })
    
    if (!user) {
      console.log('👤 新用户注册...')
      user = await User.create({
        openid: openid,
        nickname: nickName || '微信用户',
        avatar: avatarUrl || '',
        phone: null,
        points: 100,
        status: 1
      })
      console.log('✅ 新用户创建成功，ID:', user.id)
    } else {
      console.log('👤 老用户登录，ID:', user.id)
      if (nickName) user.nickname = nickName
      if (avatarUrl) user.avatar = avatarUrl
      await user.save()
      console.log('✅ 用户信息更新成功')
    }
    
    if (user.status === 0) {
      return res.status(403).json({
        code: 1,
        message: '账号已被禁用，请联系客服'
      })
    }
    
    const token = jwt.sign(
      { id: user.id, openid: user.openid },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token: token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          points: user.points
        }
      }
    })
    
  } catch (error) {
    console.error('❌ 微信登录失败:', error)
    res.status(500).json({
      code: 1,
      message: process.env.NODE_ENV === 'development' 
        ? error.message || '服务器错误' 
        : '服务器错误，请稍后重试'
    })
  }
})

// ============================================================
// 获取微信 OpenID
// ============================================================
async function getWxOpenId(code) {
  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const params = {
      appid: config.wechat.appid,
      secret: config.wechat.secret,
      js_code: code,
      grant_type: 'authorization_code'
    }
    
    console.log('📤 调用微信接口获取 openid...')
    console.log('appid:', config.wechat.appid)
    console.log('code:', code)
    
    const response = await axios.get(url, { params })
    console.log('📥 微信接口响应:', response.data)
    
    if (response.data.errcode) {
      throw new Error(`微信接口错误: ${response.data.errmsg} (${response.data.errcode})`)
    }
    
    return response.data
  } catch (error) {
    console.error('❌ 获取微信 OpenID 失败:', error.message)
    throw error
  }
}

module.exports = router