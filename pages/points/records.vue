<template>
  <view class="records-page">
    <!-- ===== 积分汇总 ===== -->
    <view class="summary-card">
      <view class="summary-item">
        <text class="summary-label">当前积分</text>
        <text class="summary-value">{{ currentPoints }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">本月收入</text>
        <text class="summary-value income">{{ monthlyIncome }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">本月支出</text>
        <text class="summary-value expense">{{ monthlyExpense }}</text>
      </view>
    </view>

    <!-- ===== Tab 筛选 ===== -->
    <view class="filter-tabs">
      <view 
        class="filter-tab" 
        v-for="tab in filterTabs" 
        :key="tab.key"
        :class="{ active: currentFilter === tab.key }"
        @tap="switchFilter(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- ===== 加载状态 ===== -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- ===== 记录列表 ===== -->
    <view v-else class="records-list">
      <view 
        class="record-item" 
        v-for="record in filteredRecords" 
        :key="record.id"
      >
        <view class="record-left">
          <text class="record-icon">{{ getIcon(record.type) }}</text>
          <view class="record-info">
            <text class="record-title">{{ record.description }}</text>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
        </view>
        <view class="record-right" :class="record.amount > 0 ? 'income' : 'expense'">
          {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="loadingMore" class="load-more">
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && filteredRecords.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无记录</text>
        <text class="empty-desc">签到、看广告、充值获取积分</text>
      </view>
      
      <!-- 已加载全部 -->
      <view v-if="!loading && !loadingMore && filteredRecords.length > 0 && filteredRecords.length >= total" class="load-more">
        <text>— 已加载全部 {{ total }} 条记录 —</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'  // ✅ ref 和 computed 从 vue 导入
import { onShow } from '@dcloudio/uni-app'  // ✅ onShow 从 uni-app 导入
import { pointsAPI } from '@/utils/api.js'

// ===== 响应式数据 =====
const currentPoints = ref(0)
const monthlyIncome = ref(0)
const monthlyExpense = ref(0)
const currentFilter = ref('all')
const records = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' }
]

// ===== 计算属性 =====
const filteredRecords = computed(() => {
  if (currentFilter.value === 'all') {
    return records.value
  }
  if (currentFilter.value === 'income') {
    return records.value.filter(r => r.amount > 0)
  }
  return records.value.filter(r => r.amount < 0)
})

// ===== 生命周期 =====
onShow(() => {
  page.value = 1
  records.value = []
  loadData()
})

// ===== 方法 =====
const loadData = async (isLoadMore = false) => {
  if (loading.value || loadingMore.value) return
  if (!isLoadMore) {
    page.value = 1
    records.value = []
  }
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  
  try {
    const params = {
      page: page.value,
      limit: 20
    }
    if (currentFilter.value === 'income') {
      params.type = 'income'
    } else if (currentFilter.value === 'expense') {
      params.type = 'expense'
    }
    
    const res = await pointsAPI.records(params)
    console.log('积分记录:', res.data)
    
    if (isLoadMore) {
      records.value = [...records.value, ...res.data.list]
    } else {
      records.value = res.data.list
      // 更新汇总数据
      currentPoints.value = res.data.list.length > 0 ? res.data.current_points || 0 : 0
      monthlyIncome.value = res.data.totalIncome || 0
      monthlyExpense.value = res.data.totalExpense || 0
    }
    
    total.value = res.data.total
    hasMore.value = records.value.length < total.value
    
  } catch (err) {
    console.error('加载积分记录失败:', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多（触底时调用）
const loadMore = () => {
  if (!hasMore.value || loadingMore.value || loading.value) return
  page.value++
  loadData(true)
}

// 切换筛选
const switchFilter = (key) => {
  currentFilter.value = key
  page.value = 1
  records.value = []
  loadData()
}

// 获取图标
const getIcon = (type) => {
  const icons = {
    signin: '📅',
    ad: '📺',
    recharge: '💎',
    unlock: '📚',
    replenish: '🔄',
    refund: '↩️',
    admin: '🛠️'
  }
  return icons[type] || '📌'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$success: #1DD1A1;
$danger: #FF6B6B;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.records-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.summary-card {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .summary-item {
    flex: 1;
    text-align: center;
    
    .summary-label {
      font-size: 24rpx;
      color: $text-hint;
      display: block;
    }
    
    .summary-value {
      font-size: 40rpx;
      font-weight: 700;
      color: $text-primary;
      display: block;
      margin-top: 6rpx;
      
      &.income {
        color: $success;
      }
      
      &.expense {
        color: $danger;
      }
    }
  }
  
  .summary-divider {
    width: 1rpx;
    background: #F0F2F8;
  }
}

.filter-tabs {
  display: flex;
  background: #fff;
  border-radius: 60rpx;
  padding: 6rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .filter-tab {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: $text-secondary;
    border-radius: 60rpx;
    transition: all 0.3s ease;
    
    &.active {
      background: $primary;
      color: #fff;
      font-weight: 600;
    }
  }
}

.loading-state {
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 80rpx 0;
  text-align: center;
  
  .loading-text {
    font-size: 28rpx;
    color: $text-hint;
  }
}

.records-list {
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
      
      &.expense {
        color: $danger;
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 24rpx 0;
  color: $text-hint;
  font-size: 24rpx;
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