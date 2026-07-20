<template>
  <view class="favorites-page">
    <!-- ===== 统计 ===== -->
    <view class="stats-bar">
      <text>共 {{ favoritesList.length }} 篇收藏</text>
    </view>

    <!-- ===== 收藏列表 ===== -->
    <view class="favorites-list">
      <view 
        class="favorite-item" 
        v-for="item in favoritesList" 
        :key="item.id"
        @tap="goToDetail(item.id)"
      >
        <image class="cover" :src="item.cover || '/static/default-cover.png'" mode="aspectFill" />
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="summary">{{ item.summary }}</text>
          <view class="meta">
            <text class="meta-tag" :class="item.type === 1 ? 'free' : 'pay'">
              {{ item.type === 1 ? '免费' : item.points_required + '积分' }}
            </text>
            <text class="meta-view">👁️ {{ item.view_count || 0 }}</text>
          </view>
          <view class="actions">
            <text class="action-btn" @tap.stop="removeFavorite(item.id)">取消收藏</text>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && favoritesList.length === 0" class="empty-state">
        <text class="empty-icon">❤️</text>
        <text class="empty-text">还没有收藏</text>
        <text class="empty-desc">去发现更多精彩内容吧</text>
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
const favoritesList = ref([])
const loading = ref(false)

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadData()
})

// ============================================================
// 加载收藏列表
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    // 从本地缓存获取收藏的ID列表
    const favorites = uni.getStorageSync('favorites') || []
    
    if (favorites.length === 0) {
      favoritesList.value = []
      loading.value = false
      return
    }
    
    // 批量获取文章详情
    const promises = favorites.map(id => articleAPI.detail(id))
    const results = await Promise.allSettled(promises)
    
    const list = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        list.push(result.value)
      } else {
        console.error('获取文章失败 ID:', favorites[index])
      }
    })
    
    favoritesList.value = list
    console.log('收藏列表加载完成，共', list.length, '篇')
    
  } catch (err) {
    console.error('加载收藏列表失败:', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ============================================================
// 取消收藏
// ============================================================
const removeFavorite = (id) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏吗？',
    success: (res) => {
      if (res.confirm) {
        const favorites = uni.getStorageSync('favorites') || []
        const index = favorites.indexOf(id)
        if (index > -1) {
          favorites.splice(index, 1)
          uni.setStorageSync('favorites', favorites)
          loadData()
          uni.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    }
  })
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

.favorites-page {
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

.favorites-list {
  .favorite-item {
    display: flex;
    background: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
    
    .cover {
      width: 160rpx;
      height: 160rpx;
      flex-shrink: 0;
    }
    
    .info {
      flex: 1;
      padding: 20rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .title {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        display: block;
      }
      
      .summary {
        font-size: 24rpx;
        color: $text-secondary;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .meta {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-top: 8rpx;
        
        .meta-tag {
          font-size: 20rpx;
          padding: 2rpx 12rpx;
          border-radius: 12rpx;
          color: #fff;
          
          &.free {
            background: #1DD1A1;
          }
          
          &.pay {
            background: #FF6B6B;
          }
        }
        
        .meta-view {
          font-size: 20rpx;
          color: $text-hint;
        }
      }
      
      .actions {
        margin-top: 8rpx;
        
        .action-btn {
          font-size: 22rpx;
          color: #FF6B6B;
          padding: 4rpx 16rpx;
          border: 1rpx solid #FF6B6B;
          border-radius: 20rpx;
          
          &:active {
            opacity: 0.6;
          }
        }
      }
    }
  }
}

.loading-state {
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx 0;
  text-align: center;
  color: $text-hint;
  font-size: 28rpx;
}

.empty-state {
  padding: 100rpx 0;
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