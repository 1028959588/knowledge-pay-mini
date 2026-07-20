const express = require('express')
const { Op } = require('sequelize')
const auth = require('../middleware/auth')
const { User, CheckinRecord, PointsRecord } = require('../models')

const router = express.Router()

// 签到奖励规则
const SIGN_RULES = [5, 10, 15, 20, 25, 30, 50]

// ============================================================
// 获取今日签到状态
// ============================================================
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const record = await CheckinRecord.findOne({
      where: {
        user_id: req.user.id,
        checkin_date: today
      }
    })
    
    // 计算连续签到天数
    const continuousDays = await getContinuousDays(req.user.id)
    
    res.json({
      code: 0,
      data: {
        hasCheckedIn: !!record,
        continuousDays,
        todayPoints: SIGN_RULES[continuousDays % 7] || 5
      }
    })
  } catch (error) {
    console.error('获取签到状态失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 执行签到
// ============================================================
router.post('/do', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 检查是否已签到
    const exist = await CheckinRecord.findOne({
      where: { user_id: req.user.id, checkin_date: today }
    })
    if (exist) {
      return res.status(400).json({ code: 1, message: '今天已签到' })
    }
    
    // 计算连续签到天数
    const continuousDays = await getContinuousDays(req.user.id)
    const pointsEarned = SIGN_RULES[continuousDays % 7] || 5
    
    // 创建签到记录
    await CheckinRecord.create({
      user_id: req.user.id,
      checkin_date: today,
      continuous_days: continuousDays + 1,
      points_earned: pointsEarned,
      is_replenish: 0
    })
    
    // 增加积分
    const user = await User.findByPk(req.user.id)
    user.points += pointsEarned
    await user.save()
    
    // 记录积分变动
    await PointsRecord.create({
      user_id: req.user.id,
      amount: pointsEarned,
      type: 'signin',
      description: `每日签到 +${pointsEarned} 积分（连续${continuousDays + 1}天）`
    })
    
    res.json({
      code: 0,
      message: '签到成功',
      data: {
        pointsEarned,
        continuousDays: continuousDays + 1,
        totalPoints: user.points
      }
    })
  } catch (error) {
    console.error('签到失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 获取签到日历
// ============================================================
router.get('/calendar', auth, async (req, res) => {
  try {
    const { year, month } = req.query
    const currentYear = parseInt(year) || new Date().getFullYear()
    const currentMonth = parseInt(month) || new Date().getMonth() + 1
    
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`
    
    const records = await CheckinRecord.findAll({
      where: {
        user_id: req.user.id,
        checkin_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    })
    
    const recordMap = {}
    records.forEach(r => {
      recordMap[r.checkin_date] = { isReplenish: r.is_replenish === 1 }
    })
    
    res.json({
      code: 0,
      data: {
        year: currentYear,
        month: currentMonth,
        records: recordMap
      }
    })
  } catch (error) {
    console.error('获取日历失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 补签
// ============================================================
router.post('/replenish', auth, async (req, res) => {
  try {
    const { date } = req.body
    
    if (!date) {
      return res.status(400).json({ code: 1, message: '请选择补签日期' })
    }
    
    // 检查是否已签到
    const exist = await CheckinRecord.findOne({
      where: { user_id: req.user.id, checkin_date: date }
    })
    if (exist) {
      return res.status(400).json({ code: 1, message: '该日期已签到' })
    }
    
    // 检查日期是否在过去
    const today = new Date().toISOString().split('T')[0]
    if (date >= today) {
      return res.status(400).json({ code: 1, message: '只能补签过去的日期' })
    }
    
    // 检查积分
    const user = await User.findByPk(req.user.id)
    if (user.points < 20) {
      return res.status(400).json({ code: 1, message: '积分不足，补签需要20积分' })
    }
    
    // 扣除积分
    user.points -= 20
    await user.save()
    
    // 创建补签记录
    await CheckinRecord.create({
      user_id: req.user.id,
      checkin_date: date,
      continuous_days: 0,
      points_earned: 0,
      is_replenish: 1
    })
    
    await PointsRecord.create({
      user_id: req.user.id,
      amount: -20,
      type: 'replenish',
      description: `补签 ${date} -20 积分`
    })
    
    res.json({
      code: 0,
      message: '补签成功',
      data: { totalPoints: user.points }
    })
  } catch (error) {
    console.error('补签失败:', error)
    res.status(500).json({ code: 1, message: '服务器错误' })
  }
})

// ============================================================
// 辅助函数：计算连续签到天数
// ============================================================
async function getContinuousDays(userId) {
  const today = new Date().toISOString().split('T')[0]
  let days = 0
  let currentDate = new Date()
  
  // 检查今天是否签到
  const todayRecord = await CheckinRecord.findOne({
    where: { user_id: userId, checkin_date: today }
  })
  
  if (!todayRecord) {
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const record = await CheckinRecord.findOne({
      where: { user_id: userId, checkin_date: dateStr }
    })
    if (record && record.is_replenish === 0) {
      days++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return days
}

module.exports = router