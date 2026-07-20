// backend/src/api/admin/articles.js

const express = require('express')
const { Op } = require('sequelize')
const auth = require('../../middleware/auth')
const { Article, Category } = require('../../models')

const router = express.Router()

// ============================================================
// 文章列表（返回统计数据）
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const { keyword, category_id, type, status, is_top, page = 1, limit = 20 } = req.query
    
    const where = {}
    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` }
    }
    if (category_id) where.category_id = parseInt(category_id)
    if (type) where.type = parseInt(type)
    if (status !== undefined && status !== '') where.status = parseInt(status)
    if (is_top !== undefined && is_top !== '') where.is_top = parseInt(is_top)
    
    // ✅ 获取总数
    const total = await Article.count({ where })
    
    // ✅ 获取各状态统计（全量数据）
    const allCount = await Article.count()
    const publishedCount = await Article.count({ where: { status: 1 } })
    const draftCount = await Article.count({ where: { status: 0 } })
    const topCount = await Article.count({ where: { is_top: 1 } })
    
    const { rows } = await Article.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name'] }],
      order: [
        ['is_top', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    })
    
    // 格式化数据
    const list = rows.map(article => {
      const plain = article.toJSON ? article.toJSON() : article
      return {
        ...plain,
        category_name: plain.Category?.name || '未分类'
      }
    })
    
    res.json({
      code: 0,
      data: {
        list: list,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        // ✅ 返回统计数据
        stats: {
          all: allCount,
          published: publishedCount,
          draft: draftCount,
          top: topCount
        }
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
router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    console.log('📄 获取文章详情，ID:', id)
    
    if (isNaN(id)) {
      return res.status(400).json({ code: 1, message: '无效的文章ID' })
    }
    
    const article = await Article.findByPk(id, {
      include: [{ model: Category, attributes: ['name'] }]
    })
    
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    console.log('✅ 文章数据:', article.id, article.title)
    
    // ✅ 返回标准格式
    res.json({
      code: 0,
      data: {
        id: article.id,
        title: article.title,
        subtitle: article.subtitle || '',
        cover: article.cover || '',
        summary: article.summary || '',
        content: article.content || '',
        category_id: article.category_id,
        category_name: article.Category?.name || '',
        type: article.type,
        points_required: article.points_required || 0,
        status: article.status,
        is_top: article.is_top || 0,
        publish_time: article.publish_time,
        view_count: article.view_count || 0,
        pay_count: article.pay_count || 0,
        created_at: article.created_at,
        updated_at: article.updated_at
      }
    })
    
  } catch (error) {
    console.error('❌ 获取文章详情失败:', error)
    res.status(500).json({
      code: 1,
      message: error.message || '服务器错误，请稍后重试'
    })
  }
})

// ============================================================
// 发布文章
// ============================================================
router.post('/', auth, async (req, res) => {
  try {
    const { title, subtitle, cover, summary, content, video_url, category_id, type, points_required, is_top, status, publish_time } = req.body
    
    const article = await Article.create({
      title,
      subtitle: subtitle || '',
      cover: cover || '',
      summary: summary || '',
      content,
      video_url: video_url || '',
      category_id: category_id || null,
      type: type || 1,
      points_required: points_required || 0,
      is_top: is_top ? 1 : 0,
      status: status || 1,
      publish_time: publish_time || new Date()
    })
    
    res.json({
      code: 0,
      message: '发布成功',
      data: article
    })
  } catch (error) {
    console.error('发布文章失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 更新文章
// ============================================================
router.put('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id)
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    const { title, subtitle, cover, summary, content, video_url, category_id, type, points_required, is_top, status, publish_time } = req.body
    
    await article.update({
      title,
      subtitle: subtitle || '',
      cover: cover || '',
      summary: summary || '',
      content,
      video_url: video_url || '',
      category_id: category_id || null,
      type: type || 1,
      points_required: points_required || 0,
      is_top: is_top ? 1 : 0,
      status: status || 1,
      publish_time: publish_time || article.publish_time
    })
    
    res.json({
      code: 0,
      message: '更新成功',
      data: article
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 删除文章
// ============================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id)
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    await article.destroy()
    res.json({ code: 0, message: '删除成功' })
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 上下架
// ============================================================
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const article = await Article.findByPk(req.params.id)
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    article.status = status
    await article.save()
    
    res.json({
      code: 0,
      message: status === 1 ? '已发布' : '已下架'
    })
  } catch (error) {
    console.error('更新文章状态失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 置顶/取消置顶
// ============================================================
router.put('/:id/top', auth, async (req, res) => {
  try {
    const { is_top } = req.body
    const article = await Article.findByPk(req.params.id)
    if (!article) {
      return res.status(404).json({ code: 1, message: '文章不存在' })
    }
    
    article.is_top = is_top ? 1 : 0
    await article.save()
    
    res.json({
      code: 0,
      message: is_top ? '已置顶' : '已取消置顶'
    })
  } catch (error) {
    console.error('更新置顶状态失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

module.exports = router