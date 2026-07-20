<template>
  <view class="unlock-page">
    <!-- ===== 统计 ===== -->
    <view class="stats-bar">
      <text>已解锁 {{ unlockList.length }} 篇内容</text>
    </view>

    <!-- ===== 解锁列表 ===== -->
    <view class="unlock-list">
      <view 
        class="unlock-item" 
        v-for="item in unlockList" 
        :key="item.article_id"
        @tap="goToDetail(item.article_id)"
      >
        <view class="item-left">
          <text class="item-icon">🔓</text>
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-time">解锁于 {{ item.unlocked_at }}</text>
          </view>
        </view>
        <view class="item-right">
          <text class="item-cost">-{{ item.points_cost }}积分</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && unlockList.length === 0" class="empty-state">
        <text class="empty-icon">🔓</text>
        <text class="empty-text">还没有解锁内容</text>
        <text class="empty-desc">去解锁一些精彩内容吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { articleAPI } from '@/utils/api.js'

// ============================================================
// 响应式数据
// ============================================================
const unlockList = ref([])
const loading = ref(false)

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadData()
})

// ============================================================
// 加载解锁记录
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    // 从本地缓存获取解锁记录
    const records = uni.getStorageSync('unlockRecords') || []
    
    // 获取文章详情，更新标题等信息
    const promises = records.map(record => 
      articleAPI.detail(record.article_id)
        .then(article => ({
          ...record,
          title: article.title || record.title,
          cover: article.cover || ''
        }))
        .catch(() => record)
    )
    
    const results = await Promise.allSettled(promises)
    const list = []
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        list.push(result.value)
      }
    })
    
    // 按解锁时间排序（最新在前）
    list.sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))
    
    unlockList.value = list
    console.log('解锁记录加载完成，共', list.length, '条')
    
  } catch (err) {
    console.error('加载解锁记录失败:', err)
    // 降级：直接从缓存显示
    const records = uni.getStorageSync('unlockRecords') || []
    unlockList.value = records
  } finally {
    loading.value = false
  }
}

// ============================================================
// 跳转详情
// ============================================================
const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/article/detail?id=${id}` })
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.unlock-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.stats-bar {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: $text-hint;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.unlock-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 0 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .unlock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F0F2F8;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      opacity: 0.6;
    }
    
    .item-left {
      display: flex;
      align-items: center;
      flex: 1;
      
      .item-icon {
        font-size: 36rpx;
        margin-right: 20rpx;
      }
      
      .item-info {
        flex: 1;
        
        .item-title {
          font-size: 28rpx;
          color: $text-primary;
          display: block;
        }
        
        .item-time {
          font-size: 22rpx;
          color: $text-hint;
          margin-top: 4rpx;
          display: block;
        }
      }
    }
    
    .item-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      
      .item-cost {
        font-size: 24rpx;
        color: #FF6B6B;
        margin-right: 12rpx;
      }
      
      .item-arrow {
        font-size: 28rpx;
        color: $text-hint;
      }
    }
  }
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: $text-hint;
  font-size: 28rpx;
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