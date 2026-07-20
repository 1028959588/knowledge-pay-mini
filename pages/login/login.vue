<template>
  <view class="login-page">
    <!-- ===== 背景装饰 ===== -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- ===== Logo 区域 ===== -->
    <view class="logo-section">
      <view class="logo-wrapper">
        <text class="logo-icon">📚</text>
      </view>
      <text class="app-name">知识付费</text>
      <text class="app-slogan">让知识更有价值</text>
    </view>

    <!-- ===== 登录卡片 ===== -->
    <view class="login-card">
      <!-- ===== 微信登录（仅小程序） ===== -->
      <!-- #ifdef MP-WEIXIN -->
      <view class="wx-login-section">
        <button class="wx-login-btn" @tap="handleWxLogin" hover-class="wx-login-btn-hover">
          <text class="wx-icon-text">💬</text>
          <text>微信一键登录</text>
        </button>
        <text class="wx-tip">首次登录即自动注册</text>
      </view>

      <view class="divider">
        <view class="divider-line"></view>
        <view class="divider-dot"></view>
        <text class="divider-text">其他方式</text>
        <view class="divider-dot"></view>
        <view class="divider-line"></view>
      </view>
      <!-- #endif -->

      <!-- ===== 邮箱登录（小程序 + App） ===== -->
      <view class="email-login-section">
        <button class="email-login-btn" @tap="goToEmailLogin" hover-class="email-login-btn-hover">
          <text class="email-icon">✉️</text>
          <text>邮箱登录</text>
        </button>
        <text class="email-tip">支持验证码登录 / 密码登录 · 首次登录自动注册</text>
      </view>

      <!-- ===== 底部版权 ===== -->
      <view class="footer">
        <text>登录即代表同意《用户协议》和《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { authAPI } from '@/utils/api.js'
import { setLoginState } from '@/utils/store.js'

// ============================================================
// 微信登录（小程序）
// ============================================================
// #ifdef MP-WEIXIN
const handleWxLogin = () => {
  console.log('=== 微信登录 ===')
  
  uni.showLoading({ title: '登录中...', mask: true })
  
  uni.getUserProfile({
    desc: '用于完善用户资料',
    success: (profileRes) => {
      console.log('✅ 获取用户信息成功:', profileRes.userInfo)
      
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          console.log('✅ 获取 code 成功:', loginRes.code)
          
          try {
            const userInfo = {
              nickName: profileRes.userInfo.nickName,
              avatarUrl: profileRes.userInfo.avatarUrl
            }
            
            const res = await authAPI.wxLogin(loginRes.code, userInfo)
            console.log('✅ 后端响应:', res)
            
            uni.hideLoading()
            setLoginState(res.data.token, res.data.userInfo)
            
            uni.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              uni.switchTab({ url: '/pages/index/index' })
            }, 500)
          } catch (err) {
            uni.hideLoading()
            console.error('❌ 微信登录失败:', err)
            uni.showToast({ title: err.message || '登录失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('❌ 获取 code 失败:', err)
          uni.hideLoading()
          uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
        }
      })
    },
    fail: (err) => {
      console.error('❌ 获取用户信息失败:', err)
      uni.hideLoading()
      uni.showModal({
        title: '温馨提示',
        content: '需要获取您的头像和昵称，才能使用微信登录。是否重新授权？',
        confirmText: '去授权',
        success: (modalRes) => {
          if (modalRes.confirm) {
            handleWxLogin()
          }
        }
      })
    }
  })
}
// #endif

// ============================================================
// 跳转邮箱登录页
// ============================================================
const goToEmailLogin = () => {
  uni.navigateTo({ url: '/pages/login/email-login' })
}
</script>

<style lang="scss" scoped>
// ============================================================
// 颜色变量
// ============================================================
$primary: #6C5CE7;
$primary-light: #A29BFE;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$wx-green: #07C160;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;
$bg-start: #F8F9FF;
$bg-end: #EEF1FF;
$card-shadow: 0 20px 60px rgba(108, 92, 231, 0.15);
$border-radius: 24rpx;

// ============================================================
// 页面容器
// ============================================================
.login-page {
  min-height: 100vh;
  padding: 40rpx 40rpx 60rpx;
  background: linear-gradient(180deg, $bg-start 0%, $bg-end 100%);
  position: relative;
  overflow: hidden;
}

// ============================================================
// 背景装饰
// ============================================================
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.06;
    
    &.circle-1 {
      width: 600rpx;
      height: 600rpx;
      background: $primary;
      top: -200rpx;
      right: -200rpx;
    }
    
    &.circle-2 {
      width: 400rpx;
      height: 400rpx;
      background: $primary-light;
      bottom: 100rpx;
      left: -150rpx;
    }
    
    &.circle-3 {
      width: 200rpx;
      height: 200rpx;
      background: $primary;
      top: 40%;
      right: -80rpx;
    }
  }
}

// ============================================================
// Logo 区域
// ============================================================
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40rpx;
  position: relative;
  z-index: 1;
  
  .logo-wrapper {
    width: 140rpx;
    height: 140rpx;
    background: $primary-gradient;
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 40rpx rgba(108, 92, 231, 0.3);
    
    .logo-icon {
      font-size: 72rpx;
    }
  }
  
  .app-name {
    font-size: 44rpx;
    font-weight: 700;
    color: $text-primary;
    margin-top: 24rpx;
    letter-spacing: 2rpx;
  }
  
  .app-slogan {
    font-size: 26rpx;
    color: $text-secondary;
    margin-top: 8rpx;
    letter-spacing: 4rpx;
  }
}

// ============================================================
// 登录卡片
// ============================================================
.login-card {
  position: relative;
  z-index: 1;
  margin-top: 50rpx;
  padding: 40rpx 36rpx 30rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: $border-radius;
  box-shadow: $card-shadow;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

// ============================================================
// 微信登录
// ============================================================
.wx-login-section {
  .wx-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 32rpx 0;
    background: $wx-green;
    color: #fff;
    font-size: 36rpx;
    font-weight: 500;
    border-radius: 60rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
    
    .wx-icon-text {
      font-size: 44rpx;
      margin-right: 16rpx;
    }
    
    &:active {
      transform: scale(0.97);
      opacity: 0.9;
    }
  }
  
  .wx-login-btn-hover {
    transform: scale(0.97);
    opacity: 0.9;
  }
  
  .wx-tip {
    display: block;
    text-align: center;
    font-size: 24rpx;
    color: $text-hint;
    margin-top: 20rpx;
  }
}

// ============================================================
// 分割线
// ============================================================
.divider {
  display: flex;
  align-items: center;
  margin: 30rpx 0 24rpx;
  
  .divider-line {
    flex: 1;
    height: 1rpx;
    background: linear-gradient(90deg, transparent, #E0E0E0, transparent);
  }
  
  .divider-dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background: #D0D0D0;
    margin: 0 8rpx;
  }
  
  .divider-text {
    font-size: 24rpx;
    color: $text-hint;
    padding: 0 16rpx;
    letter-spacing: 2rpx;
  }
}

// ============================================================
// 邮箱登录
// ============================================================
.email-login-section {
  margin-top: 10rpx;
  
  .email-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 32rpx 0;
    background: $primary-gradient;
    color: #fff;
    font-size: 36rpx;
    font-weight: 500;
    border-radius: 60rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(108, 92, 231, 0.35);
    
    .email-icon {
      font-size: 44rpx;
      margin-right: 16rpx;
    }
    
    &:active {
      transform: scale(0.97);
      opacity: 0.9;
    }
  }
  
  .email-login-btn-hover {
    transform: scale(0.97);
    opacity: 0.9;
  }
  
  .email-tip {
    display: block;
    text-align: center;
    font-size: 22rpx;
    color: $text-hint;
    margin-top: 16rpx;
  }
}

// ============================================================
// 底部版权
// ============================================================
.footer {
  margin-top: 40rpx;
  text-align: center;
  
  text {
    font-size: 22rpx;
    color: $text-hint;
    letter-spacing: 1rpx;
  }
}
</style>