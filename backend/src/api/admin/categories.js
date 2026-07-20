// backend/src/api/admin/categories.js

const express = require('express')
const auth = require('../../middleware/auth')
const { Category } = require('../../models')

const router = express.Router()

// ============================================================
// 分类列表（修复版）
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['sort_order', 'ASC']]
    })
    
    console.log('📂 分类列表返回:', categories.length, '条')
    
    res.json({ 
      code: 0, 
      data: categories 
    })
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '获取分类失败' 
    })
  }
})

// ============================================================
// 创建分类
// ============================================================
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, sort_order, status } = req.body
    
    if (!name) {
      return res.status(400).json({ code: 1, message: '分类名称不能为空' })
    }
    
    const category = await Category.create({
      name,
      icon: icon || '📚',
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    })
    
    res.json({ 
      code: 0, 
      message: '创建成功', 
      data: category 
    })
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '创建失败' 
    })
  }
})

// ============================================================
// 更新分类
// ============================================================
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return res.status(404).json({ code: 1, message: '分类不存在' })
    }
    
    const { name, icon, sort_order, status } = req.body
    await category.update({ name, icon, sort_order, status })
    
    res.json({ 
      code: 0, 
      message: '更新成功', 
      data: category 
    })
  } catch (error) {
    console.error('更新分类失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '更新失败' 
    })
  }
})

// ============================================================
// 删除分类
// ============================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return res.status(404).json({ code: 1, message: '分类不存在' })
    }
    
    await category.destroy()
    res.json({ 
      code: 0, 
      message: '删除成功' 
    })
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '删除失败' 
    })
  }
})

module.exports = router