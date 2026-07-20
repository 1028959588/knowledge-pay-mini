<template>
  <view class="mine-container">
    <!-- ===== 用户信息卡片 ===== -->
    <view class="user-card" @tap="goToEditProfile">
      <image 
        class="avatar" 
        :src="userAvatar" 
        mode="aspectFill"
        @error="onAvatarError"
      />
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
        <text class="phone">{{ userInfo.phone || '点击绑定手机' }}</text>
      </view>
      <view class="points-badge" @tap.stop="goToPointsRecords">
        <text class="points-num">{{ userInfo.points || 0 }}</text>
        <text class="points-label">积分 ›</text>
      </view>
    </view>

    <!-- ===== 统计数据 ===== -->
    <view class="stats-row">
      <view class="stats-item" @tap="goToFavorites">
        <text class="stats-number">{{ favoritesCount }}</text>
        <text class="stats-label">收藏</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item" @tap="goToUnlockRecords">
        <text class="stats-number">{{ unlockCount }}</text>
        <text class="stats-label">已解锁</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item" @tap="goToConsumeRecords">
        <text class="stats-number">{{ consumeCount }}</text>
        <text class="stats-label">消费</text>
      </view>
    </view>

    <!-- ===== 功能菜单 ===== -->
    <view class="menu-group">
      <view class="menu-title">我的内容</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goToFavorites">
          <text class="menu-icon">❤️</text>
          <text class="menu-text">我的收藏</text>
          <text class="menu-badge">{{ favoritesCount }}</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goToUnlockRecords">
          <text class="menu-icon">🔓</text>
          <text class="menu-text">已解锁内容</text>
          <text class="menu-badge">{{ unlockCount }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-title">积分与交易</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goToPointsRecords">
          <text class="menu-icon">📊</text>
          <text class="menu-text">积分记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goToConsumeRecords">
          <text class="menu-icon">💸</text>
          <text class="menu-text">消费记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goToRechargeRecords">
          <text class="menu-icon">💳</text>
          <text class="menu-text">充值记录</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-title">设置</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goToSecurity">
          <text class="menu-icon">🔐</text>
          <text class="menu-text">安全设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goToEditProfile">
          <text class="menu-icon">✏️</text>
          <text class="menu-text">编辑资料</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ===== 退出登录 ===== -->
    <view class="logout-wrapper">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userAPI } from '@/utils/api.js'
import { clearLoginState, getUserInfo, updateUserInfo } from '@/utils/store.js'

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
  phone: '',
  points: 0
})
const favoritesCount = ref(0)
const unlockCount = ref(0)
const consumeCount = ref(0)

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
  loadStats()
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
    console.log('用户信息:', res.data)
    userInfo.value = res.data
    updateUserInfo(res.data)
  } catch (err) {
    console.error('获取用户信息失败:', err)
    if (err.code === 401) {
      clearLoginState()
      uni.showToast({ title: '请重新登录', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/login' })
      }, 1500)
    } else {
      const info = getUserInfo()
      if (info) {
        userInfo.value = info
      } else {
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  }
}

// ============================================================
// 加载统计数据
// ============================================================
const loadStats = () => {
  const favorites = uni.getStorageSync('favorites') || []
  favoritesCount.value = favorites.length
  
  const unlockRecords = uni.getStorageSync('unlockRecords') || []
  unlockCount.value = unlockRecords.length
  
  // 消费统计（从积分记录计算）
  const pointsRecords = uni.getStorageSync('pointsRecords') || []
  consumeCount.value = pointsRecords.filter(r => r.amount < 0).length
}

// ============================================================
// 跳转方法
// ============================================================
const goToEditProfile = () => {
  uni.navigateTo({ url: '/pages/profile/edit' })
}

const goToSecurity = () => {
  uni.navigateTo({ url: '/pages/settings/security' })
}

const goToPointsRecords = () => {
  uni.navigateTo({ url: '/pages/points/records' })
}

const goToConsumeRecords = () => {
  uni.navigateTo({ url: '/pages/records/consume' })
}

const goToRechargeRecords = () => {
  uni.navigateTo({ url: '/pages/records/recharge' })
}

const goToFavorites = () => {
  uni.navigateTo({ url: '/pages/favorites/list' })
}

const goToUnlockRecords = () => {
  uni.navigateTo({ url: '/pages/unlock/records' })
}

// ============================================================
// 退出登录
// ============================================================
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        clearLoginState()
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.mine-container {
  min-height: 100vh;
  padding: 30rpx;
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
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255,255,255,0.3);
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
    
    .phone {
      font-size: 24rpx;
      color: rgba(255,255,255,0.7);
      margin-top: 4rpx;
      display: block;
    }
  }
  
  .points-badge {
    background: rgba(255,255,255,0.2);
    border-radius: 16rpx;
    padding: 16rpx 24rpx;
    text-align: center;
    
    &:active {
      opacity: 0.7;
    }
    
    .points-num {
      font-size: 40rpx;
      font-weight: 700;
      color: #fff;
      display: block;
    }
    
    .points-label {
      font-size: 22rpx;
      color: rgba(255,255,255,0.8);
    }
  }
}

// ===== 统计数据 =====
.stats-row {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 0;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .stats-item {
    flex: 1;
    text-align: center;
    
    &:active {
      opacity: 0.6;
    }
    
    .stats-number {
      font-size: 32rpx;
      font-weight: 700;
      color: $text-primary;
      display: block;
    }
    
    .stats-label {
      font-size: 22rpx;
      color: $text-hint;
      display: block;
      margin-top: 4rpx;
    }
  }
  
  .stats-divider {
    width: 1rpx;
    background: #F0F2F8;
  }
}

// ===== 菜单 =====
.menu-group {
  margin-top: 30rpx;
  
  .menu-title {
    font-size: 26rpx;
    color: $text-hint;
    padding: 0 8rpx 12rpx;
    display: block;
  }
  
  .menu-list {
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 28rpx 30rpx;
      border-bottom: 1rpx solid #F0F2F8;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background: #F8F9FF;
      }
      
      .menu-icon {
        font-size: 36rpx;
        margin-right: 24rpx;
      }
      
      .menu-text {
        flex: 1;
        font-size: 28rpx;
        color: $text-primary;
      }
      
      .menu-badge {
        font-size: 24rpx;
        color: #fff;
        background: #FF6B6B;
        padding: 2rpx 16rpx;
        border-radius: 20rpx;
        margin-right: 12rpx;
        min-width: 32rpx;
        text-align: center;
      }
      
      .menu-arrow {
        font-size: 32rpx;
        color: $text-hint;
      }
    }
  }
}

// ===== 退出按钮 =====
.logout-wrapper {
  margin-top: 60rpx;
  
  .logout-btn {
    width: 100%;
    padding: 28rpx 0;
    background: #fff;
    color: #FF6B6B;
    font-size: 30rpx;
    border-radius: 60rpx;
    border: none;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
    
    &:active {
      opacity: 0.6;
    }
  }
}
</style>