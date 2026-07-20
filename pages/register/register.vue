<template>
  <view class="register-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
    </view>

    <!-- 头部 -->
    <view class="header">
      <view class="back-btn" @tap="goToLogin">
        <text>← 返回</text>
      </view>
      <text class="header-title">注册账号</text>
      <text class="header-subtitle">填写信息，开始知识之旅</text>
    </view>

    <!-- 注册卡片 -->
    <view class="register-card">
      <view class="form-item">
        <view class="form-icon">📞</view>
        <input 
          class="form-input" 
          type="number" 
          maxlength="11"
          placeholder="请输入手机号" 
          placeholder-class="input-placeholder"
          v-model="phone"
          @input="onPhoneInput"
        />
        <text v-if="phone.length === 11" class="input-check">✅</text>
      </view>
      
      <view class="form-item code-item">
        <view class="form-icon">✉️</view>
        <input 
          class="form-input code-input" 
          type="number" 
          maxlength="6"
          placeholder="请输入验证码" 
          placeholder-class="input-placeholder"
          v-model="code"
        />
        <button 
          class="code-btn" 
          @tap="sendCode" 
          :disabled="countdown > 0"
          :class="{ 'code-btn-active': countdown === 0 && phone.length === 11 }"
        >
          {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
        </button>
      </view>
      
      <view class="form-item password-item">
        <view class="form-icon">🔑</view>
        <input 
          class="form-input" 
          :type="showPassword ? 'text' : 'password'"
          placeholder="设置密码（至少6位）" 
          placeholder-class="input-placeholder"
          v-model="password"
        />
        <text class="password-toggle" @tap="togglePassword">
          {{ showPassword ? '🙈' : '👁️' }}
        </text>
      </view>
      
      <view class="form-item password-item">
        <view class="form-icon">✓</view>
        <input 
          class="form-input" 
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="确认密码" 
          placeholder-class="input-placeholder"
          v-model="confirmPassword"
        />
        <text class="password-toggle" @tap="toggleConfirmPassword">
          {{ showConfirmPassword ? '🙈' : '👁️' }}
        </text>
      </view>
      
      <!-- 密码强度提示 -->
      <view v-if="password.length > 0" class="password-strength">
        <view class="strength-bar">
          <view 
            class="strength-fill" 
            :class="passwordStrength.class"
            :style="{ width: passwordStrength.percent + '%' }"
          ></view>
        </view>
        <text class="strength-text">{{ passwordStrength.text }}</text>
      </view>
      
      <button 
        class="register-btn" 
        @tap="handleRegister" 
        :disabled="!canRegister || registering"
      >
        {{ registering ? '注册中...' : '注 册' }}
      </button>

      <view class="login-link">
        <text>已有账号？</text>
        <text class="link-text" @tap="goToLogin">去登录 →</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api.js'

// ===== 响应式数据 =====
const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const countdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const registering = ref(false)

// ===== 计算属性 =====
const canRegister = computed(() => {
  return (
    phone.value.length === 11 &&
    code.value.length >= 4 &&
    password.value.length >= 6 &&
    password.value === confirmPassword.value
  )
})

// 密码强度
const passwordStrength = computed(() => {
  const len = password.value.length
  if (len === 0) return { class: '', percent: 0, text: '' }
  if (len < 6) return { class: 'weak', percent: 33, text: '密码太短' }
  if (len < 10) return { class: 'medium', percent: 66, text: '密码强度中等' }
  return { class: 'strong', percent: 100, text: '密码强度很好' }
})

// ===== 方法 =====
const onPhoneInput = () => {
  phone.value = phone.value.replace(/\D/g, '')
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// ============================================================
// 发送验证码
// ============================================================
const sendCode = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  try {
    const res = await authAPI.sendCode(phone.value)
    console.log('验证码发送成功:', res)
    
    // 开发环境：显示验证码方便测试
    if (res.data && res.data.code) {
      uni.showToast({ title: `验证码: ${res.data.code}`, icon: 'none', duration: 3000 })
    } else {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
    }
    
    // 倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
  } catch (err) {
    console.error('发送验证码失败:', err)
    uni.showToast({ title: err.message || '发送失败，请重试', icon: 'none' })
  }
}

// ============================================================
// 注册
// ============================================================
const handleRegister = async () => {
  // 手机号校验
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  // 验证码校验
  if (!code.value || code.value.length < 4) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  
  // 密码校验
  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return
  }
  
  // 确认密码校验
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  registering.value = true
  
  try {
    console.log('=== 开始注册 ===')
    console.log('手机号:', phone.value)
    console.log('验证码:', code.value)
    console.log('密码:', password.value)
    
    const res = await authAPI.register(phone.value, code.value, password.value)
    console.log('注册响应:', res)
    
    // 保存登录信息
    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userInfo', res.data.userInfo)
    uni.setStorageSync('isLogin', true)
    
    uni.showToast({ title: '注册成功 🎉', icon: 'success' })
    
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
    
  } catch (err) {
    console.error('注册失败:', err)
    uni.showToast({ title: err.message || '注册失败，请重试', icon: 'none' })
  } finally {
    registering.value = false
  }
}

// ============================================================
// 跳转
// ============================================================
const goToLogin = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
// ============================================================
// 变量（与登录页保持一致）
// ============================================================
$primary: #6C5CE7;
$primary-light: #A29BFE;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;
$bg-start: #F8F9FF;
$bg-end: #EEF1FF;
$card-shadow: 0 20px 60px rgba(108, 92, 231, 0.15);

// ============================================================
// 页面容器
// ============================================================
.register-page {
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
      width: 500rpx;
      height: 500rpx;
      background: $primary;
      top: -200rpx;
      right: -150rpx;
    }
    
    &.circle-2 {
      width: 350rpx;
      height: 350rpx;
      background: $primary-light;
      bottom: 100rpx;
      left: -100rpx;
    }
  }
}

// ============================================================
// 头部
// ============================================================
.header {
  position: relative;
  z-index: 1;
  padding-top: 20rpx;
  
  .back-btn {
    font-size: 28rpx;
    color: $text-secondary;
    
    &:active {
      opacity: 0.6;
    }
  }
  
  .header-title {
    display: block;
    font-size: 44rpx;
    font-weight: 700;
    color: $text-primary;
    margin-top: 24rpx;
  }
  
  .header-subtitle {
    display: block;
    font-size: 26rpx;
    color: $text-secondary;
    margin-top: 8rpx;
  }
}

// ============================================================
// 注册卡片
// ============================================================
.register-card {
  position: relative;
  z-index: 1;
  margin-top: 40rpx;
  padding: 40rpx 36rpx 30rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  box-shadow: $card-shadow;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

// ============================================================
// 表单
// ============================================================
.form-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #F0F2F8;
  transition: border-color 0.2s ease;
  
  &:focus-within {
    border-color: $primary;
  }
  
  .form-icon {
    font-size: 32rpx;
    margin-right: 20rpx;
    opacity: 0.6;
  }
  
  .form-input {
    flex: 1;
    font-size: 30rpx;
    color: $text-primary;
    padding: 8rpx 0;
    
    &::placeholder {
      color: $text-hint;
    }
  }
  
  .input-check {
    font-size: 28rpx;
    opacity: 0.8;
  }
  
  .input-placeholder {
    color: $text-hint;
  }
}

.code-item {
  .code-input {
    flex: 0.7;
  }
  
  .code-btn {
    font-size: 24rpx;
    color: $text-hint;
    background: #F0F2F8;
    border: none;
    padding: 14rpx 24rpx;
    border-radius: 40rpx;
    transition: all 0.2s ease;
    flex-shrink: 0;
    
    &-active {
      color: #fff;
      background: $primary-gradient;
      box-shadow: 0 4rpx 16rpx rgba(108, 92, 231, 0.3);
      
      &:active {
        transform: scale(0.95);
      }
    }
    
    &:disabled {
      color: $text-hint;
      background: #F0F2F8;
      opacity: 0.6;
    }
  }
}

.password-item {
  .password-toggle {
    font-size: 32rpx;
    padding: 8rpx 12rpx;
    opacity: 0.5;
    
    &:active {
      opacity: 0.8;
    }
  }
}

// ============================================================
// 密码强度
// ============================================================
.password-strength {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  
  .strength-bar {
    flex: 1;
    height: 6rpx;
    background: #F0F2F8;
    border-radius: 4rpx;
    overflow: hidden;
    
    .strength-fill {
      height: 100%;
      border-radius: 4rpx;
      transition: all 0.3s ease;
      
      &.weak {
        background: #FF6B6B;
      }
      &.medium {
        background: #FECA57;
      }
      &.strong {
        background: #1DD1A1;
      }
    }
  }
  
  .strength-text {
    font-size: 22rpx;
    color: $text-hint;
    margin-left: 16rpx;
    flex-shrink: 0;
  }
}

// ============================================================
// 注册按钮
// ============================================================
.register-btn {
  width: 100%;
  padding: 30rpx 0;
  margin-top: 32rpx;
  background: $primary-gradient;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 60rpx;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 8rpx 32rpx rgba(108, 92, 231, 0.3);
  
  &:active {
    transform: scale(0.97);
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    transform: scale(1);
    box-shadow: none;
  }
}

// ============================================================
// 登录入口
// ============================================================
.login-link {
  text-align: center;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #F0F2F8;
  font-size: 28rpx;
  color: $text-secondary;
  
  .link-text {
    color: $primary;
    font-weight: 600;
    margin-left: 8rpx;
    
    &:active {
      opacity: 0.7;
    }
  }
}
</style>