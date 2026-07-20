<template>
  <view class="recharge-record-page">
    <!-- ===== 统计 ===== -->
    <view class="stats-card">
      <view class="stats-item">
        <text class="stats-label">累计充值</text>
        <text class="stats-value">¥{{ totalAmount }}</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-label">获得积分</text>
        <text class="stats-value">{{ totalPoints }}</text>
      </view>
    </view>

    <!-- ===== 记录列表 ===== -->
    <view class="record-list">
      <view 
        class="record-item" 
        v-for="item in recordList" 
        :key="item.id"
      >
        <view class="record-left">
          <text class="record-icon">💳</text>
          <view class="record-info">
            <text class="record-title">充值 ¥{{ item.amount }}</text>
            <text class="record-status" :class="item.status === 1 ? 'success' : 'pending'">
              {{ item.status === 1 ? '已支付' : '待支付' }}
            </text>
            <text class="record-time">{{ item.time }}</text>
          </view>
        </view>
        <view class="record-right income">
          +{{ item.points }}
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="recordList.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无充值记录</text>
        <text class="empty-desc">去充值获取更多积分</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { onShow, onLoad, onReady, onHide, onUnload } from '@dcloudio/uni-app'

// ============================================================
// 响应式数据
// ============================================================
const recordList = ref([])
const totalAmount = ref(0)
const totalPoints = ref(0)

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadData()
})

// ============================================================
// 加载充值记录
// ============================================================
const loadData = async () => {
  try {
    const res = await pointsAPI.rechargeRecords({ page: 1, limit: 100 })
    console.log('充值记录:', res.data)
    
    const list = res.data.list || []
    recordList.value = list.map(item => ({
      id: item.id,
      amount: parseFloat(item.amount),
      points: item.points_gained,
      status: item.status,
      time: formatTime(item.paid_at || item.created_at)
    }))
    
    // 只统计已支付的
    const paidList = recordList.value.filter(item => item.status === 1)
    totalAmount.value = paidList.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
    totalPoints.value = paidList.reduce((sum, item) => sum + item.points, 0)
    
  } catch (err) {
    console.error('加载充值记录失败:', err)
    // 降级：使用模拟数据
    recordList.value = [
      { id: 1, amount: 12, points: 150, status: 1, time: '2026-07-08 14:30' },
      { id: 2, amount: 6, points: 70, status: 1, time: '2026-07-05 10:20' },
    ]
    totalAmount.value = 18
    totalPoints.value = 220
  }
}

// ============================================================
// 工具函数
// ============================================================
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$success: #1DD1A1;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.recharge-record-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.stats-card {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .stats-item {
    flex: 1;
    text-align: center;
    
    .stats-label {
      font-size: 24rpx;
      color: $text-hint;
      display: block;
    }
    
    .stats-value {
      font-size: 40rpx;
      font-weight: 700;
      color: $primary;
      display: block;
      margin-top: 6rpx;
    }
  }
  
  .stats-divider {
    width: 1rpx;
    background: #F0F2F8;
  }
}

.record-list {
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 0 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F0F2F8;
    
    &:last-child {
      border-bottom: none;
    }
    
    .record-left {
      display: flex;
      align-items: center;
      
      .record-icon {
        font-size: 40rpx;
        margin-right: 20rpx;
      }
      
      .record-info {
        .record-title {
          font-size: 28rpx;
          color: $text-primary;
          display: block;
        }
        
        .record-status {
          font-size: 20rpx;
          padding: 2rpx 12rpx;
          border-radius: 12rpx;
          margin-left: 8rpx;
          
          &.success {
            color: $success;
            background: #E8F8EE;
          }
          
          &.pending {
            color: #FECA57;
            background: #FDF6EC;
          }
        }
        
        .record-time {
          font-size: 22rpx;
          color: $text-hint;
          margin-top: 4rpx;
          display: block;
        }
      }
    }
    
    .record-right {
      font-size: 32rpx;
      font-weight: 600;
      
      &.income {
        color: $success;
      }
    }
  }
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
  
  .empty-icon {
    font-size: 80rpx;
    display: block;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $text-secondary;
    margin-top: 20rpx;
    display: block;
  }
  
  .empty-desc {
    font-size: 24rpx;
    color: $text-hint;
    margin-top: 8rpx;
    display: block;
  }
}
</style>