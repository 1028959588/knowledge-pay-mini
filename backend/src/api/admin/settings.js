// backend/src/api/admin/settings.js

const express = require('express')
const auth = require('../../middleware/auth')
const { Setting, Banner, Article, User, UnlockRecord } = require('../../models')

const router = express.Router()

// ============================================================
// 获取系统设置（包含 OSS 状态）
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Setting.findAll()
    const data = {}
    settings.forEach(s => {
      data[s.key] = s.value
    })
    
    // ✅ 检测 OSS 配置状态
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

// ============================================================
// Banner 列表
// ============================================================
router.get('/banners', auth, async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['sort_order', 'ASC']]
    })
    res.json({ code: 0, data: banners })
  } catch (error) {
    console.error('获取Banner失败:', error)
    res.status(500).json({ code: 1, message: '获取失败' })
  }
})

// ============================================================
// 创建 Banner
// ============================================================
router.post('/banners', auth, async (req, res) => {
  try {
    const { image, link, sort_order, status } = req.body
    
    if (!image) {
      return res.status(400).json({ code: 1, message: '图片地址不能为空' })
    }
    
    const banner = await Banner.create({
      image,
      link: link || '',
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    })
    
    res.json({ code: 0, message: '创建成功', data: banner })
  } catch (error) {
    console.error('创建Banner失败:', error)
    res.status(500).json({ code: 1, message: '创建失败' })
  }
})

// ============================================================
// 更新 Banner
// ============================================================
router.put('/banners/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ code: 1, message: 'Banner不存在' })
    }
    
    const { image, link, sort_order, status } = req.body
    await banner.update({ image, link, sort_order, status })
    
    res.json({ code: 0, message: '更新成功', data: banner })
  } catch (error) {
    console.error('更新Banner失败:', error)
    res.status(500).json({ code: 1, message: '更新失败' })
  }
})

// ============================================================
// 删除 Banner
// ============================================================
router.delete('/banners/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id)
    if (!banner) {
      return res.status(404).json({ code: 1, message: 'Banner不存在' })
    }
    
    await banner.destroy()
    res.json({ code: 0, message: '删除成功' })
  } catch (error) {
    console.error('删除Banner失败:', error)
    res.status(500).json({ code: 1, message: '删除失败' })
  }
})

module.exports = router