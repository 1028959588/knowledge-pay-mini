<template>
  <view class="index-container">
    <!-- ===== 用户信息卡片 ===== -->
    <view class="user-card" @tap="goToMine">
      <image 
        class="avatar" 
        :src="userAvatar" 
        mode="aspectFill"
        @error="onAvatarError"
      />
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
        <text class="points">💰 {{ userInfo.points || 0 }} 积分</text>
      </view>
      <view class="arrow">›</view>
    </view>

    <!-- ===== 快捷入口 ===== -->
    <view class="quick-entry">
      <view class="entry-item" @tap="goToCheckin">
        <view class="entry-icon">📅</view>
        <text class="entry-text">签到</text>
        <text class="entry-tag" v-if="!hasCheckedIn">去签到</text>
        <text class="entry-tag done" v-else>已签到</text>
      </view>
      <view class="entry-item" @tap="watchAd">
        <view class="entry-icon">📺</view>
        <text class="entry-text">看广告赚积分</text>
        <text class="entry-tag">+5</text>
      </view>
      <view class="entry-item" @tap="goToRecharge">
        <view class="entry-icon">💎</view>
        <text class="entry-text">充值</text>
        <text class="entry-tag">1元=10积分</text>
      </view>
    </view>

    <!-- ===== 分类导航 ===== -->
    <CategoryNav v-model="currentCategory" @change="onCategoryChange" />

    <!-- ===== 文章列表 ===== -->
    <view class="article-section">
      <view class="section-header">
        <text class="section-title">📚 精选内容</text>
        <text class="section-count">共 {{ totalArticles }} 篇</text>
      </view>
      
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      
      <view v-else class="article-list">
        <ArticleCard 
          v-for="item in articles" 
          :key="item.id"
          :article="item"
        />
      </view>
      
      <view v-if="!loading && articles.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">该分类暂无内容</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userAPI, checkinAPI, articleAPI } from '@/utils/api.js'
import { getUserInfo, updateUserInfo } from '@/utils/store.js'

import CategoryNav from '@/components/CategoryNav.vue'
import ArticleCard from '@/components/ArticleCard.vue'

// ============================================================
// 默认头像
// ============================================================
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236C5CE7"/%3E%3Ctext x="100" y="130" font-size="80" text-anchor="middle" fill="white" font-family="Arial"%3E📚%3C/text%3E%3C/svg%3E'

// ============================================================
// 响应式数据
// ============================================================
const userInfo = ref({
  nickname: '',
  avatar: '',
  points: 0
})
const hasCheckedIn = ref(false)
const currentCategory = ref(0)
const articles = ref([])
const totalArticles = ref(0)
const loading = ref(false)

// ============================================================
// 计算属性
// ============================================================
const userAvatar = computed(() => {
  return userInfo.value.avatar || DEFAULT_AVATAR
})

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadUserInfo()
  loadCheckinStatus()
  loadArticles()
})

// ============================================================
// 头像加载失败
// ============================================================
const onAvatarError = () => {
  userInfo.value.avatar = DEFAULT_AVATAR
}

// ============================================================
// 加载用户信息
// ============================================================
const loadUserInfo = async () => {
  try {
    const res = await userAPI.profile()
    userInfo.value = res.data
    updateUserInfo(res.data)
  } catch (err) {
    console.error('获取用户信息失败:', err)
    const info = getUserInfo()
    if (info) {
      userInfo.value = info
    }
  }
}

// ============================================================
// 加载签到状态
// ============================================================
const loadCheckinStatus = async () => {
  try {
    const res = await checkinAPI.today()
    hasCheckedIn.value = res.data.hasCheckedIn
  } catch (err) {
    console.error('获取签到状态失败:', err)
  }
}

// ============================================================
// 加载文章列表
// ============================================================
const loadArticles = async () => {
  loading.value = true
  
  try {
    const params = {
      page: 1,
      limit: 20
    }
    if (currentCategory.value > 0) {
      params.category_id = currentCategory.value
    }
    
    const res = await articleAPI.list(params)
    articles.value = res.data.list || []
    totalArticles.value = res.data.total || 0
  } catch (err) {
    console.error('加载文章失败:', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ============================================================
// 分类切换
// ============================================================
const onCategoryChange = (id) => {
  currentCategory.value = id
  loadArticles()
}

// ============================================================
// 跳转方法
// ============================================================
const goToMine = () => {
  uni.switchTab({ url: '/pages/mine/mine' })
}

const goToCheckin = () => {
  uni.navigateTo({ url: '/pages/checkin/checkin' })
}

const watchAd = () => {
  uni.showToast({ title: '广告功能开发中', icon: 'none' })
}

const goToRecharge = () => {
  uni.navigateTo({ url: '/pages/recharge/recharge' })
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);

.index-container {
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 40rpx;
  background: #F5F6FA;
}

// ===== 用户卡片 =====
.user-card {
  display: flex;
  align-items: center;
  background: $primary-gradient;
  border-radius: 24rpx;
  padding: 36rpx 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(108, 92, 231, 0.25);
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255,255,255,0.4);
    flex-shrink: 0;
    background: #fff;
  }
  
  .user-info {
    flex: 1;
    margin-left: 24rpx;
    
    .nickname {
      font-size: 34rpx;
      color: #fff;
      font-weight: 600;
      display: block;
    }
    
    .points {
      font-size: 26rpx;
      color: rgba(255,255,255,0.85);
      margin-top: 6rpx;
      display: block;
    }
  }
  
  .arrow {
    font-size: 48rpx;
    color: rgba(255,255,255,0.5);
  }
}

// ===== 快捷入口 =====
.quick-entry {
  display: flex;
  justify-content: space-around;
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .entry-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    
    .entry-icon {
      font-size: 44rpx;
    }
    
    .entry-text {
      font-size: 24rpx;
      color: #333;
      margin-top: 12rpx;
    }
    
    .entry-tag {
      font-size: 20rpx;
      color: $primary;
      background: #F0EDFF;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      margin-top: 8rpx;
      
      &.done {
        color: #1DD1A1;
        background: #E8F8F2;
      }
    }
  }
}

// ===== 文章列表 =====
.article-section {
  margin-top: 30rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #2D3436;
    }
    
    .section-count {
      font-size: 24rpx;
      color: #B2BEC3;
    }
  }
  
  .loading-state {
    background: #fff;
    border-radius: 20rpx;
    padding: 60rpx 0;
    text-align: center;
    color: #B2BEC3;
    font-size: 28rpx;
  }
  
  .empty-state {
    background: #fff;
    border-radius: 20rpx;
    padding: 80rpx 0;
    text-align: center;
    
    .empty-icon {
      font-size: 80rpx;
      display: block;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #B2BEC3;
      margin-top: 20rpx;
      display: block;
    }
  }
}
</style>