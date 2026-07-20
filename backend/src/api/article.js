const express = require('express')
const { Op } = require('sequelize')
const auth = require('../middleware/auth')
const { Article, Category, User, UnlockRecord, PointsRecord } = require('../models')

const router = express.Router()

// ============================================================
// 获取分类列表
// ============================================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    })
    res.json({ code: 0, data: categories })
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取文章列表
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { category_id, type, page = 1, limit = 20 } = req.query
    
    const where = { status: 1 }
    if (category_id && category_id !== '0') {
      where.category_id = parseInt(category_id)
    }
    if (type) {
      where.type = parseInt(type)
    }
    
    const { rows, count } = await Article.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name'] }],
      order: [
        ['is_top', 'DESC'],
        ['publish_time', 'DESC']
      ],
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
    console.error('获取文章列表失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取文章详情
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const article = await Article.findByPk(id, {
      include: [{ model: Category, attributes: ['name'] }]
    })
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    // 增加浏览量
    article.view_count += 1
    await article.save()
    
    // 检查是否已解锁（需要登录）
    let isUnlocked = false
    let userInfo = null
    
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const config = require('../config')
        const decoded = jwt.verify(token, config.jwtSecret)
        
        const user = await User.findByPk(decoded.id)
        if (user) {
          userInfo = {
            id: user.id,
            nickname: user.nickname,
            points: user.points
          }
          
          const unlock = await UnlockRecord.findOne({
            where: { user_id: user.id, article_id: id }
          })
          isUnlocked = !!unlock
        }
      } catch (e) {}
    }
    
    res.json({
      code: 0,
      data: {
        ...article.toJSON(),
        isUnlocked,
        userInfo
      }
    })
  } catch (error) {
    console.error('获取文章详情失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 解锁文章（积分支付）
// ============================================================
router.post('/:id/unlock', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id
    
    const article = await Article.findByPk(id)
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    if (article.type === 1) {
      return res.status(400).json({ code: 1, message: '该文章免费，无需解锁' })
    }
    
    // 检查是否已解锁
    const exist = await UnlockRecord.findOne({
      where: { user_id: userId, article_id: id }
    })
    if (exist) {
      return res.status(400).json({ code: 1, message: '已解锁，请勿重复操作' })
    }
    
    const user = await User.findByPk(userId)
    if (user.points < article.points_required) {
      return res.status(400).json({ 
        code: 1, 
        message: `积分不足，需要 ${article.points_required} 积分，当前 ${user.points} 积分` 
      })
    }
    
    // 扣除积分
    user.points -= article.points_required
    await user.save()
    
    // 创建解锁记录
    await UnlockRecord.create({
      user_id: userId,
      article_id: id,
      points_cost: article.points_required,
      unlocked_at: new Date()
    })
    
    // 增加付费次数
    article.pay_count += 1
    await article.save()
    
    // 记录积分变动
    await PointsRecord.create({
      user_id: userId,
      amount: -article.points_required,
      type: 'unlock',
      description: `解锁文章《${article.title}》 -${article.points_required} 积分`
    })
    
    res.json({
      code: 0,
      message: '解锁成功',
      data: {
        remainingPoints: user.points
      }
    })
  } catch (error) {
    console.error('解锁失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 检查是否已解锁
// ============================================================
router.get('/:id/check', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const record = await UnlockRecord.findOne({
      where: { user_id: req.user.id, article_id: id }
    })
    
    res.json({
      code: 0,
      data: { isUnlocked: !!record }
    })
  } catch (error) {
    console.error('检查解锁失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

module.exports = router



