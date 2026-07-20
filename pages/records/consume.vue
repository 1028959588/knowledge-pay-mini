<template>
  <view class="consume-page">
    <!-- ===== 统计 ===== -->
    <view class="stats-card">
      <view class="stats-item">
        <text class="stats-label">总消费积分</text>
        <text class="stats-value">{{ totalConsume }}</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-label">解锁数量</text>
        <text class="stats-value">{{ consumeList.length }}</text>
      </view>
    </view>

    <!-- ===== 记录列表 ===== -->
    <view class="record-list">
      <view 
        class="record-item" 
        v-for="item in consumeList" 
        :key="item.id"
      >
        <view class="record-left">
          <text class="record-icon">📚</text>
          <view class="record-info">
            <text class="record-title">{{ item.title }}</text>
            <text class="record-time">{{ item.time }}</text>
          </view>
        </view>
        <view class="record-right expense">
          -{{ item.points }}
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="consumeList.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消费记录</text>
        <text class="empty-desc">去解锁一些精彩内容吧</text>
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
const consumeList = ref([])
const totalConsume = ref(0)

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadData()
})

// ============================================================
// 加载消费记录
// ============================================================
const loadData = async () => {
  try {
    // 从积分记录中筛选支出
    const res = await pointsAPI.records({ type: 'expense', page: 1, limit: 100 })
    console.log('消费记录:', res.data)
    
    // 转换数据格式
    const list = res.data.list || []
    consumeList.value = list.map(item => ({
      id: item.id,
      title: item.description || '消费',
      points: Math.abs(item.amount),
      time: formatTime(item.created_at)
    }))
    
    // 计算总消费
    totalConsume.value = list.reduce((sum, item) => sum + Math.abs(item.amount), 0)
    
  } catch (err) {
    console.error('加载消费记录失败:', err)
    // 降级：从本地缓存读取
    const unlockRecords = uni.getStorageSync('unlockRecords') || []
    consumeList.value = unlockRecords.map((item, index) => ({
      id: index + 1,
      title: item.title || '未知内容',
      points: item.points_cost || 0,
      time: item.unlocked_at || new Date().toLocaleString()
    }))
    totalConsume.value = consumeList.value.reduce((sum, item) => sum + item.points, 0)
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
$danger: #FF6B6B;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.consume-page {
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
      color: $danger;
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
      
      &.expense {
        color: $danger;
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