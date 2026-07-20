<template>
  <view class="set-password-page">
    <!-- 使用系统导航栏，不需要自定义 -->

    <view class="form">
      <view class="info-tip">
        <text class="tip-icon">🔐</text>
        <text class="tip-text">为您的账号设置密码，方便下次登录</text>
      </view>

      <view class="form-item">
        <text class="label">📧</text>
        <text class="email-text">{{ email }}</text>
      </view>

      <view class="form-item password-item">
        <text class="label">🔑</text>
        <input 
          class="input" 
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码（至少6位）" 
          v-model="password"
        />
        <text class="toggle" @tap="showPassword = !showPassword">
          {{ showPassword ? '🙈' : '👁️' }}
        </text>
      </view>

      <view class="form-item password-item">
        <text class="label">✓</text>
        <input 
          class="input" 
          :type="showConfirm ? 'text' : 'password'"
          placeholder="请确认密码" 
          v-model="confirmPassword"
        />
        <text class="toggle" @tap="showConfirm = !showConfirm">
          {{ showConfirm ? '🙈' : '👁️' }}
        </text>
      </view>

      <view class="form-item code-item">
        <text class="label">✉️</text>
        <input 
          class="input" 
          type="number"
          maxlength="6"
          placeholder="请输入验证码" 
          v-model="code"
        />
        <button 
          class="code-btn" 
          @tap="sendCode" 
          :disabled="countdown > 0 || !emailValid"
          :class="{ active: countdown === 0 && emailValid }"
        >
          {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
        </button>
      </view>

      <view v-if="errorMessage" class="error-tip">
        <text>⚠️ {{ errorMessage }}</text>
      </view>

      <button class="set-btn" @tap="handleSetPassword" :disabled="submitting">
        {{ submitting ? '设置中...' : '✅ 设置密码' }}
      </button>

      <view class="skip-link">
        <text @tap="goHome">暂时跳过</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authAPI } from '@/utils/api.js'
import { setLoginState } from '@/utils/store.js'

// ============================================================
// 响应式数据
// ============================================================
const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const countdown = ref(0)
const submitting = ref(false)
const errorMessage = ref('')

// ============================================================
// 计算属性
// ============================================================
const emailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

// ============================================================
// 生命周期
// ============================================================
onLoad((options) => {
  if (options.email) {
    email.value = decodeURIComponent(options.email)
  }
})

// ============================================================
// 发送验证码
// ============================================================
const sendCode = async () => {
  if (!emailValid.value) {
    errorMessage.value = '请输入正确的邮箱地址'
    return
  }

  try {
    const res = await authAPI.sendEmailCode(email.value, 'set-password')
    if (res.data?.code) {
      uni.showToast({ title: `验证码: ${res.data.code}`, icon: 'none', duration: 3000 })
    } else {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
    }
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (err) {
    errorMessage.value = err.message || '发送失败'
  }
}

// ============================================================
// ✅ 设置密码 - 完成后自动登录进入 App
// ============================================================
const handleSetPassword = async () => {
  if (!password.value || password.value.length < 6) {
    errorMessage.value = '密码至少6位'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次密码输入不一致'
    return
  }
  if (!code.value || code.value.length !== 6) {
    errorMessage.value = '请输入6位验证码'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    // 设置密码
    await authAPI.setEmailPassword(email.value, code.value, password.value)
    
    // ✅ 密码设置成功后，自动登录
    const res = await authAPI.emailPasswordLogin(email.value, password.value)
    console.log('✅ 自动登录成功:', res)
    
    // 保存登录状态
    setLoginState(res.data.token, res.data.userInfo)
    
    uni.showToast({ title: '密码设置成功，已自动登录 ✅', icon: 'success' })
    
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
    
  } catch (err) {
    errorMessage.value = err.message || '设置失败'
  } finally {
    submitting.value = false
  }
}

// ============================================================
// 跳转首页
// ============================================================
const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$danger: #FF6B6B;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;
$bg-color: #F5F6FA;

.set-password-page {
  min-height: 100vh;
  padding: 30rpx 32rpx 40rpx;
  background: $bg-color;
}

.info-tip {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #F0EDFF;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  gap: 16rpx;
  
  .tip-icon {
    font-size: 32rpx;
  }
  
  .tip-text {
    flex: 1;
    font-size: 26rpx;
    color: $text-secondary;
  }
}

.form {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);

  .form-item {
    display: flex;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 2rpx solid #F0F2F8;
    
    .label {
      font-size: 32rpx;
      margin-right: 16rpx;
    }
    
    .input {
      flex: 1;
      font-size: 30rpx;
      color: $text-primary;
      padding: 8rpx 0;
    }
    
    .email-text {
      flex: 1;
      font-size: 28rpx;
      color: $text-secondary;
    }
  }
  
  .password-item {
    .toggle {
      font-size: 32rpx;
      padding: 8rpx 12rpx;
      opacity: 0.5;
      &:active { opacity: 0.8; }
    }
  }
  
  .code-item {
    .code-btn {
      font-size: 24rpx;
      color: $text-hint;
      background: transparent;
      border: none;
      padding: 12rpx 16rpx;
      flex-shrink: 0;
      font-weight: 500;
      
      &.active {
        color: $primary;
        &:active { opacity: 0.6; }
      }
      &:disabled { opacity: 0.5; }
    }
  }

  .error-tip {
    margin-top: 16rpx;
    padding: 12rpx 16rpx;
    background: #FFF0F0;
    border-radius: 8rpx;
    font-size: 26rpx;
    color: $danger;
  }

  .set-btn {
    width: 100%;
    padding: 28rpx 0;
    margin-top: 32rpx;
    background: $primary-gradient;
    color: #fff;
    font-size: 34rpx;
    font-weight: 600;
    border-radius: 60rpx;
    border: none;
    box-shadow: 0 8rpx 32rpx rgba(108,92,231,0.3);
    
    &:disabled { opacity: 0.4; }
    &:active { transform: scale(0.97); opacity: 0.9; }
  }
  
  .skip-link {
    text-align: center;
    margin-top: 20rpx;
    
    text {
      font-size: 26rpx;
      color: $text-hint;
      text-decoration: underline;
      &:active { opacity: 0.6; }
    }
  }
}
</style>