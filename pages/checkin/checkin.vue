<template>
  <view class="checkin-page">
    <!-- ===== 顶部积分卡片 ===== -->
    <view class="points-card">
      <view class="points-info">
        <text class="points-label">当前积分</text>
        <text class="points-number">{{ userPoints }}</text>
      </view>
      <view class="points-tip">
        <text>连续签到 {{ continuousDays }} 天</text>
      </view>
    </view>

    <!-- ===== 签到按钮 ===== -->
    <view class="checkin-btn-wrapper">
      <view 
        class="checkin-btn" 
        :class="{
          'checkin-btn-done': hasCheckedIn,
          'checkin-btn-animate': !hasCheckedIn
        }"
        @tap="handleCheckin"
      >
        <text v-if="!hasCheckedIn" class="btn-text">点击签到</text>
        <text v-else class="btn-text">已签到 ✅</text>
        <text v-if="!hasCheckedIn" class="btn-sub">
          今日可获得 +{{ todayPoints }} 积分
        </text>
        <text v-else class="btn-sub">明天继续加油</text>
      </view>
    </view>

    <!-- ===== 签到奖励规则 ===== -->
    <view class="rules-section">
      <text class="rules-title">📅 连续签到奖励</text>
      <view class="rules-list">
        <view 
          class="rules-item" 
          v-for="(rule, index) in signRules" 
          :key="index"
          :class="{ 'rules-item-active': index + 1 === continuousDays && !hasCheckedIn }"
        >
          <text class="rules-day">第{{ index + 1 }}天</text>
          <text class="rules-points">+{{ rule }}积分</text>
          <text v-if="index + 1 === continuousDays && !hasCheckedIn" class="rules-tag">
            当前
          </text>
        </view>
      </view>
    </view>

    <!-- ===== 签到日历 ===== -->
    <view class="calendar-section">
      <view class="calendar-header">
        <text class="calendar-title">📆 {{ currentYear }}年{{ currentMonth }}月</text>
        <view class="calendar-nav">
          <text class="nav-btn" @tap="prevMonth">‹</text>
          <text class="nav-btn" @tap="nextMonth">›</text>
        </view>
      </view>

      <view class="calendar-weekdays">
        <text v-for="day in weekDays" :key="day" class="weekday">{{ day }}</text>
      </view>

      <view class="calendar-days">
        <view 
          v-for="(item, index) in calendarDays" 
          :key="index"
          class="calendar-day"
          :class="{
            'calendar-day-empty': !item,
            'calendar-day-today': item && item.isToday,
            'calendar-day-checked': item && item.isChecked,
            'calendar-day-replenish': item && item.isReplenish,
            'calendar-day-future': item && item.isFuture
          }"
          @tap="item && item.canReplenish ? handleReplenish(item) : null"
        >
          <text v-if="item" class="day-number">{{ item.day }}</text>
          <text v-if="item && item.isChecked" class="day-badge">✓</text>
          <text v-if="item && item.isReplenish" class="day-badge replenish-badge">补</text>
          <text v-if="item && item.isToday" class="day-today">今天</text>
        </view>
      </view>

      <view class="calendar-legend">
        <view class="legend-item">
          <view class="legend-dot checked-dot"></view>
          <text>已签到</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot replenish-dot"></view>
          <text>补签</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot today-dot"></view>
          <text>今天</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot future-dot"></view>
          <text>未签到</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'  // ✅ ref 从 vue 导入
import { onShow } from '@dcloudio/uni-app'  // ✅ onShow 从 uni-app 导入
import { checkinAPI, userAPI } from '@/utils/api.js'

// ============================================================
// 签到奖励规则（连续7天递增）
// ============================================================
const SIGN_RULES = [5, 10, 15, 20, 25, 30, 50]

// ============================================================
// 响应式数据
// ============================================================
const userPoints = ref(0)
const hasCheckedIn = ref(false)
const continuousDays = ref(0)
const todayPoints = ref(5)

// 日历数据
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const calendarDays = ref([])
const signRules = SIGN_RULES

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadData()
})

// ============================================================
// 加载数据
// ============================================================
const loadData = async () => {
  await Promise.all([
    loadUserInfo(),
    loadCheckinStatus(),
    loadCalendar()
  ])
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await userAPI.profile()
    userPoints.value = res.data.points || 0
  } catch (err) {
    console.error('获取用户信息失败:', err)
    const info = uni.getStorageSync('userInfo') || {}
    userPoints.value = info.points || 0
  }
}

// 加载签到状态
const loadCheckinStatus = async () => {
  try {
    const res = await checkinAPI.today()
    console.log('签到状态:', res.data)
    hasCheckedIn.value = res.data.hasCheckedIn
    continuousDays.value = res.data.continuousDays || 0
    todayPoints.value = res.data.todayPoints || 5
  } catch (err) {
    console.error('获取签到状态失败:', err)
  }
}

// ============================================================
// 签到
// ============================================================
const handleCheckin = async () => {
  if (hasCheckedIn.value) {
    uni.showToast({ title: '今天已签到', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '签到中...', mask: true })
    
    const res = await checkinAPI.do()
    console.log('签到响应:', res)
    
    uni.hideLoading()
    
    // 更新数据
    userPoints.value = res.data.totalPoints
    hasCheckedIn.value = true
    continuousDays.value = res.data.continuousDays
    todayPoints.value = SIGN_RULES[(res.data.continuousDays - 1) % 7] || 5
    
    // 更新缓存
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.points = res.data.totalPoints
    uni.setStorageSync('userInfo', userInfo)
    
    // 刷新日历
    await loadCalendar()
    
    // 显示成功弹窗
    uni.showModal({
      title: '🎉 签到成功',
      content: `获得 ${res.data.pointsEarned} 积分\n连续签到 ${res.data.continuousDays} 天`,
      showCancel: false,
      confirmText: '太棒了'
    })
    
  } catch (err) {
    uni.hideLoading()
    console.error('签到失败:', err)
    uni.showToast({ title: err.message || '签到失败，请重试', icon: 'none' })
  }
}

// ============================================================
// 补签
// ============================================================
const handleReplenish = (dayData) => {
  if (!dayData || !dayData.canReplenish) return
  
  if (userPoints.value < 20) {
    uni.showModal({
      title: '积分不足',
      content: '补签需要消耗 20 积分，当前积分不足。去赚取更多积分？',
      confirmText: '去赚积分',
      success: (res) => {
        if (res.confirm) {
          uni.switchTab({ url: '/pages/index/index' })
        }
      }
    })
    return
  }
  
  uni.showModal({
    title: '📌 补签确认',
    content: `补签 ${dayData.date} 需要消耗 20 积分，确定要补签吗？`,
    confirmText: '确定补签',
    cancelText: '再想想',
    success: async (res) => {
      if (res.confirm) {
        await doReplenish(dayData)
      }
    }
  })
}

const doReplenish = async (dayData) => {
  try {
    uni.showLoading({ title: '补签中...', mask: true })
    
    const res = await checkinAPI.replenish(dayData.date)
    console.log('补签响应:', res)
    
    uni.hideLoading()
    
    // 更新数据
    userPoints.value = res.data.totalPoints
    
    // 更新缓存
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.points = res.data.totalPoints
    uni.setStorageSync('userInfo', userInfo)
    
    // 刷新日历和状态
    await Promise.all([
      loadCalendar(),
      loadCheckinStatus()
    ])
    
    uni.showToast({ title: '补签成功', icon: 'success' })
    
  } catch (err) {
    uni.hideLoading()
    console.error('补签失败:', err)
    uni.showToast({ title: err.message || '补签失败', icon: 'none' })
  }
}

// ============================================================
// 签到日历
// ============================================================
const loadCalendar = async () => {
  try {
    const res = await checkinAPI.calendar(currentYear.value, currentMonth.value)
    console.log('日历数据:', res.data)
    
    const { year, month, records } = res.data
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // 构建日历数据
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    
    const days = []
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isToday = dateStr === todayStr
      const record = records[dateStr]
      const isChecked = !!record
      const isReplenish = record ? record.isReplenish : false
      
      const dateObj = new Date(year, month - 1, d)
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const canReplenish = isPast && !isChecked && !isToday
      
      days.push({
        day: d,
        date: dateStr,
        isToday: isToday,
        isChecked: isChecked,
        isReplenish: isReplenish,
        isFuture: !isPast && !isToday,
        canReplenish: canReplenish
      })
    }
    
    calendarDays.value = days
    
  } catch (err) {
    console.error('加载日历失败:', err)
  }
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadCalendar()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadCalendar()
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-light: #A29BFE;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$success: #1DD1A1;
$warning: #FECA57;
$danger: #FF6B6B;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.checkin-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.points-card {
  background: $primary-gradient;
  border-radius: 24rpx;
  padding: 40rpx 36rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 12rpx 40rpx rgba(108, 92, 231, 0.3);
  
  .points-info {
    .points-label {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
      display: block;
    }
    
    .points-number {
      font-size: 56rpx;
      font-weight: 700;
      color: #fff;
      display: block;
      margin-top: 4rpx;
    }
  }
  
  .points-tip {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 40rpx;
    padding: 12rpx 24rpx;
    
    text {
      font-size: 26rpx;
      color: #fff;
    }
  }
}

.checkin-btn-wrapper {
  margin-top: 30rpx;
  
  .checkin-btn {
    background: linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%);
    border-radius: 24rpx;
    padding: 48rpx 0;
    text-align: center;
    box-shadow: 0 12rpx 40rpx rgba(238, 90, 36, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.97);
    }
    
    .btn-text {
      font-size: 40rpx;
      font-weight: 700;
      color: #fff;
      display: block;
    }
    
    .btn-sub {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 8rpx;
      display: block;
    }
  }
  
  .checkin-btn-done {
    background: linear-gradient(135deg, $success 0%, #10AC84 100%);
    box-shadow: 0 12rpx 40rpx rgba(29, 209, 161, 0.3);
  }
  
  .checkin-btn-animate {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.rules-section {
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .rules-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .rules-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .rules-item {
      display: flex;
      align-items: center;
      padding: 8rpx 20rpx;
      background: #F5F6FA;
      border-radius: 40rpx;
      border: 2rpx solid transparent;
      transition: all 0.3s ease;
      
      .rules-day {
        font-size: 24rpx;
        color: $text-secondary;
      }
      
      .rules-points {
        font-size: 24rpx;
        font-weight: 600;
        color: $primary;
        margin-left: 8rpx;
      }
      
      .rules-tag {
        font-size: 20rpx;
        color: #fff;
        background: $primary;
        border-radius: 20rpx;
        padding: 2rpx 12rpx;
        margin-left: 8rpx;
      }
    }
    
    .rules-item-active {
      border-color: $primary;
      background: rgba(108, 92, 231, 0.08);
    }
  }
}

.calendar-section {
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .calendar-title {
      font-size: 30rpx;
      font-weight: 600;
      color: $text-primary;
    }
    
    .calendar-nav {
      display: flex;
      
      .nav-btn {
        font-size: 36rpx;
        color: $text-hint;
        padding: 0 16rpx;
        
        &:active {
          color: $primary;
        }
      }
    }
  }
  
  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8rpx;
    margin-bottom: 12rpx;
    
    .weekday {
      text-align: center;
      font-size: 26rpx;
      color: $text-hint;
      padding: 8rpx 0;
    }
  }
  
  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8rpx;
    
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 16rpx;
      position: relative;
      transition: all 0.2s ease;
      
      .day-number {
        font-size: 28rpx;
        color: $text-primary;
      }
      
      .day-badge {
        position: absolute;
        top: 2rpx;
        right: 2rpx;
        font-size: 18rpx;
        color: #fff;
        background: $success;
        width: 28rpx;
        height: 28rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .replenish-badge {
        background: $warning;
        font-size: 16rpx;
      }
      
      .day-today {
        font-size: 18rpx;
        color: #fff;
        background: $primary;
        border-radius: 12rpx;
        padding: 0 10rpx;
        margin-top: 2rpx;
      }
    }
    
    .calendar-day-empty {
      visibility: hidden;
    }
    
    .calendar-day-today {
      background: rgba(108, 92, 231, 0.10);
      border: 2rpx solid $primary;
    }
    
    .calendar-day-checked {
      background: rgba(29, 209, 161, 0.12);
      
      .day-number {
        color: $success;
      }
    }
    
    .calendar-day-replenish {
      background: rgba(254, 202, 87, 0.12);
      
      .day-number {
        color: $warning;
      }
    }
    
    .calendar-day-future {
      .day-number {
        color: $text-hint;
      }
    }
  }
  
  .calendar-legend {
    display: flex;
    justify-content: center;
    gap: 24rpx;
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #F0F2F8;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      .legend-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
      }
      
      .checked-dot {
        background: $success;
      }
      
      .replenish-dot {
        background: $warning;
      }
      
      .today-dot {
        background: $primary;
      }
      
      .future-dot {
        background: #E0E0E0;
      }
      
      text {
        font-size: 22rpx;
        color: $text-secondary;
      }
    }
  }
}
</style>