<template>
  <view class="change-email-page">
    <!-- 使用系统导航栏 -->

    <view class="form">
      <!-- 当前邮箱 -->
      <view class="info-item">
        <text class="info-label">当前邮箱</text>
        <text class="info-value">{{ currentEmail || '未绑定' }}</text>
      </view>

      <!-- 新邮箱 -->
      <view class="form-item">
        <text class="label">📧</text>
        <input 
          class="input" 
          type="text"
          placeholder="请输入新邮箱地址" 
          v-model="newEmail"
        />
        <text v-if="emailValid" class="check">✅</text>
      </view>

      <!-- 验证码 -->
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

      <button class="submit-btn" @tap="handleChangeEmail" :disabled="submitting">
        {{ submitting ? '提交中...' : '确认更换' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { authAPI, userAPI } from '@/utils/api.js'

const currentEmail = ref('')
const newEmail = ref('')
const code = ref('')
const countdown = ref(0)
const submitting = ref(false)
const errorMessage = ref('')

const emailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.value)
})

onShow(() => {
  const info = uni.getStorageSync('userInfo') || {}
  currentEmail.value = info.email || ''
})

const sendCode = async () => {
  if (!emailValid.value) {
    errorMessage.value = '请输入正确的邮箱地址'
    return
  }

  try {
    const res = await authAPI.sendEmailCode(newEmail.value, 'change-email')
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

const handleChangeEmail = async () => {
  if (!emailValid.value) {
    errorMessage.value = '请输入正确的邮箱地址'
    return
  }
  if (!code.value || code.value.length !== 6) {
    errorMessage.value = '请输入6位验证码'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    // TODO: 调用更换邮箱接口
    // await userAPI.changeEmail(newEmail.value, code.value)
    
    uni.showToast({ title: '邮箱更换成功 ✅', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (err) {
    errorMessage.value = err.message || '更换失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$danger: #FF6B6B;
$success: #1DD1A1;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;
$bg-color: #F5F6FA;

.change-email-page {
  min-height: 100vh;
  padding: 30rpx 32rpx 40rpx;
  background: $bg-color;
}

.form {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0 24rpx;
    border-bottom: 2rpx solid #F0F2F8;
    margin-bottom: 16rpx;
    
    .info-label {
      font-size: 28rpx;
      color: $text-secondary;
    }
    
    .info-value {
      font-size: 28rpx;
      color: $text-primary;
      font-weight: 500;
    }
  }

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
    
    .check {
      font-size: 28rpx;
      color: $success;
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

  .submit-btn {
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
}
</style>