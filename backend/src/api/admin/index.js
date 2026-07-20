const express = require('express')
const { Op } = require('sequelize')  // ✅ 正确导入 Op
const auth = require('../../middleware/auth')
const { sequelize, User, Article, Category, RechargeOrder, UnlockRecord } = require('../../models')

const router = express.Router()

// ============================================================
// 仪表盘数据
// ============================================================
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    // 统计总用户数
    const totalUsers = await User.count()
    
    // 统计今日新增用户
    const todayUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    })
    
    // 统计昨日新增用户（用于计算增长率）
    const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    const yesterdayUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: yesterdayStart,
          [Op.lt]: todayStart
        }
      }
    })
    
    // 统计总文章数
    const totalArticles = await Article.count()
    
    // 统计今日发布文章数
    const todayArticles = await Article.count({
      where: {
        publish_time: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    })
    
    // 统计充值总额（已支付）
    const rechargeResult = await RechargeOrder.sum('amount', {
      where: { status: 1 }
    })
    const totalRecharge = rechargeResult || 0
    
    // 统计积分消耗总量
    const pointsCostResult = await UnlockRecord.sum('points_cost')
    const totalPointsCost = pointsCostResult || 0
    
    // 统计今日充值
    const todayRecharge = await RechargeOrder.sum('amount', {
      where: {
        status: 1,
        paid_at: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    }) || 0
    
    // 计算增长率
    const userGrowthRate = yesterdayUsers > 0 
      ? Math.round(((todayUsers - yesterdayUsers) / yesterdayUsers) * 100) 
      : 0
    
    // 计算文章增长率
    const yesterdayArticles = await Article.count({
      where: {
        publish_time: {
          [Op.gte]: yesterdayStart,
          [Op.lt]: todayStart
        }
      }
    })
    const articleGrowthRate = yesterdayArticles > 0 
      ? Math.round(((todayArticles - yesterdayArticles) / yesterdayArticles) * 100) 
      : 0
    
    res.json({
      code: 0,
      data: {
        totalUsers: totalUsers || 0,
        todayUsers: todayUsers || 0,
        userGrowth: userGrowthRate,
        totalArticles: totalArticles || 0,
        todayArticles: todayArticles || 0,
        articleGrowth: articleGrowthRate,
        totalRecharge: parseFloat(totalRecharge || 0).toFixed(2),
        totalPointsCost: totalPointsCost || 0,
        todayRecharge: parseFloat(todayRecharge || 0).toFixed(2)
      }
    })
    
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    res.status(500).json({ 
      code: 1, 
      message: '获取数据失败，请稍后重试' 
    })
  }
})
// ============================================================
// 管理后台子路由
// ============================================================
router.use('/users', require('./users'))
router.use('/articles', require('./articles'))
router.use('/categories', require('./categories'))
router.use('/orders', require('./orders'))
router.use('/settings', require('./settings'))

module.exports = router