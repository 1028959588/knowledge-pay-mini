// backend/src/api/settings.js

const express = require('express')
const auth = require('../middleware/auth')
const { Setting } = require('../models')

const router = express.Router()

// ============================================================
// 默认协议内容
// ============================================================
const DEFAULT_USER_AGREEMENT = `
<h1>用户协议</h1>

<p><strong>欢迎使用小吴知识库！</strong></p>

<p>本协议是您与小吴知识库之间关于使用本平台服务的法律协议。请您仔细阅读以下条款，点击"登录"即表示您同意接受本协议的全部内容。</p>

<h2>一、服务内容</h2>
<p>本平台提供知识内容展示、付费阅读、积分体系等服务。</p>

<h2>二、用户账号</h2>
<p>1. 用户需通过微信授权或手机号注册登录。</p>
<p>2. 用户应妥善保管账号信息，因账号泄露造成的损失由用户自行承担。</p>

<h2>三、用户行为规范</h2>
<p>1. 不得发布违法违规内容。</p>
<p>2. 不得侵犯他人知识产权。</p>
<p>3. 不得利用平台进行商业推广。</p>

<h2>四、知识产权</h2>
<p>本平台所有内容（包括但不限于文字、图片、视频）的知识产权归平台或原作者所有。</p>

<h2>五、免责声明</h2>
<p>本平台不对用户因使用本服务而产生的任何直接或间接损失承担责任。</p>

<h2>六、协议修改</h2>
<p>平台有权修改本协议，修改后的协议将在平台公示。</p>

<p style="text-align: center; margin-top: 30px; color: #909399;">更新日期：2026年7月</p>
`

const DEFAULT_PRIVACY_POLICY = `
<h1>隐私政策</h1>

<p><strong>小吴知识库重视您的隐私安全，请仔细阅读本政策。</strong></p>

<h2>一、信息收集</h2>
<p>我们收集的信息包括：</p>
<ul>
<li>微信昵称、头像（用于账号识别和展示）</li>
<li>手机号（用于账号绑定和登录）</li>
<li>邮箱地址（用于接收通知）</li>
</ul>

<h2>二、信息使用</h2>
<p>收集的信息用于：</p>
<ul>
<li>账号注册与登录</li>
<li>提供知识内容服务</li>
<li>发送系统通知</li>
<li>优化用户体验</li>
</ul>

<h2>三、信息保护</h2>
<p>我们采取严格的技术和管理措施保护您的信息安全，防止信息泄露、篡改或丢失。</p>

<h2>四、信息分享</h2>
<p>我们不会向第三方出售或分享您的个人信息，法律法规要求的情况除外。</p>

<h2>五、用户权利</h2>
<p>您可以随时查看、修改您的个人信息，也可以申请注销账号。</p>

<h2>六、Cookie 使用</h2>
<p>我们使用 Cookie 来优化您的使用体验，Cookie 不包含个人信息。</p>

<h2>七、政策更新</h2>
<p>本政策可能适时更新，更新后的政策将在平台公示。</p>

<p style="text-align: center; margin-top: 30px; color: #909399;">更新日期：2026年7月</p>
`

// ============================================================
// 获取协议内容（不需要登录）
// ============================================================
router.get('/agreement', async (req, res) => {
  try {
    const { type } = req.query
    
    if (!type || !['user', 'privacy'].includes(type)) {
      return res.status(400).json({ code: 1, message: '无效的协议类型' })
    }
    
    const key = type === 'user' ? 'user_agreement' : 'privacy_policy'
    
    // 查找数据库中的协议
    const setting = await Setting.findOne({ where: { key } })
    
    // 如果数据库中没有，返回默认内容
    const defaultContent = type === 'user' 
      ? DEFAULT_USER_AGREEMENT 
      : DEFAULT_PRIVACY_POLICY
    
    res.json({
      code: 0,
      data: setting?.value || defaultContent
    })
  } catch (error) {
    console.error('❌ 获取协议失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '获取协议失败，请稍后重试' 
    })
  }
})

// ============================================================
// 更新协议内容（需要登录）
// ============================================================
router.put('/agreement', auth, async (req, res) => {
  try {
    const { type, content } = req.body
    
    if (!type || !['user', 'privacy'].includes(type)) {
      return res.status(400).json({ code: 1, message: '无效的协议类型' })
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ code: 1, message: '协议内容不能为空' })
    }
    
    const key = type === 'user' ? 'user_agreement' : 'privacy_policy'
    
    let setting = await Setting.findOne({ where: { key } })
    
    if (setting) {
      setting.value = content
      await setting.save()
    } else {
      setting = await Setting.create({
        key,
        value: content,
        description: type === 'user' ? '用户协议' : '隐私政策'
      })
    }
    
    res.json({
      code: 0,
      message: '✅ 协议保存成功',
      data: setting
    })
  } catch (error) {
    console.error('❌ 更新协议失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '保存协议失败，请稍后重试' 
    })
  }
})

// ============================================================
// 获取系统设置
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Setting.findAll()
    const data = {}
    settings.forEach(s => {
      data[s.key] = s.value
    })
    
    // OSS 状态
    const ossConfigured = !!(process.env.OSS_ACCESS_KEY_ID && 
                             process.env.OSS_ACCESS_KEY_SECRET && 
                             process.env.OSS_BUCKET)
    data.oss_configured = ossConfigured
    
    res.json({ code: 0, data })
  } catch (error) {
    console.error('获取设置失败:', error)
    res.status(500).json({ code: 1, message: '获取失败' })
  }
})

// ============================================================
// 更新系统设置
// ============================================================
router.put('/', auth, async (req, res) => {
  try {
    const updates = req.body
    
    for (const [key, value] of Object.entries(updates)) {
      const setting = await Setting.findOne({ where: { key } })
      if (setting) {
        setting.value = String(value)
        await setting.save()
      }
    }
    
    res.json({ code: 0, message: '设置已更新' })
  } catch (error) {
    console.error('更新设置失败:', error)
    res.status(500).json({ code: 1, message: '更新失败' })
  }
})

// ============================================================
// 获取系统统计
// ============================================================
router.get('/stats', auth, async (req, res) => {
  try {
    const { Article, User, UnlockRecord } = require('../models')
    
    const [totalArticles, totalUsers, totalPointsCost] = await Promise.all([
      Article.count(),
      User.count(),
      UnlockRecord.sum('points_cost')
    ])
    
    res.json({
      code: 0,
      data: {
        totalArticles: totalArticles || 0,
        totalUsers: totalUsers || 0,
        totalPointsCost: totalPointsCost || 0
      }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ code: 1, message: '获取失败' })
  }
})

module.exports = router