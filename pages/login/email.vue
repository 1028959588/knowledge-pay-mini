<template>
  <view class="email-login-page">
    <view class="header">
      <text class="back" @tap="goBack">‹ 返回</text>
      <text class="title">邮箱登录</text>
    </view>

    <view class="form">
      <view class="form-item">
        <text class="label">📧</text>
        <input 
          class="input" 
          type="text"
          placeholder="请输入邮箱地址" 
          v-model="email"
          @input="onEmailInput"
        />
        <text v-if="emailValid" class="check">✅</text>
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
        <text class="error-text">{{ errorMessage }}</text>
      </view>

      <button class="login-btn" @tap="loginByCode" :disabled="!canSubmit">
        {{ submitting ? '登录中...' : '登 录' }}
      </button>

      <view class="register-link">
        <text>还没有账号？</text>
        <text class="link" @tap="goToRegister">立即注册 →</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api.js'
import { setLoginState } from '@/utils/store.js'

const email = ref('')
const code = ref('')
const countdown = ref(0)
const submitting = ref(false)
const errorMessage = ref('')

const emailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

const canSubmit = computed(() => {
  return emailValid.value && code.value.length === 6 && !submitting.value
})

const onEmailInput = () => {
  errorMessage.value = ''
}

const sendCode = async () => {
  if (!emailValid.value) {
    errorMessage.value = '请输入正确的邮箱地址'
    return
  }

  try {
    const res = await authAPI.sendEmailCode(email.value, 'login')
    console.log('验证码发送成功:', res)
    
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

const loginByCode = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const res = await authAPI.emailLogin(email.value, code.value)
    console.log('登录成功:', res)
    
    setLoginState(res.data.token, res.data.userInfo)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (err) {
    errorMessage.value = err.message || '登录失败'
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/login/email-register' })
}
</script>

<style lang="scss" scoped>
.email-login-page {
  min-height: 100vh;
  padding: 40rpx 36rpx;
  background: #F5F6FA;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 0 40rpx;
  
  .back {
    font-size: 28rpx;
    color: #636E72;
    padding: 8rpx 16rpx;
  }
  
  .title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: #2D3436;
  }
}

.form {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
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
      color: #2D3436;
      padding: 8rpx 0;
    }
    
    .check {
      font-size: 28rpx;
    }
  }
  
  .code-item {
    .code-btn {
      font-size: 24rpx;
      color: #B2BEC3;
      background: #F5F6FA;
      border: none;
      padding: 12rpx 24rpx;
      border-radius: 40rpx;
      
      &.active {
        color: #fff;
        background: #6C5CE7;
      }
      
      &:disabled {
        opacity: 0.5;
      }
    }
  }

  .error-tip {
    margin-top: 16rpx;
    padding: 12rpx 16rpx;
    background: #FFF0F0;
    border-radius: 8rpx;
    
    .error-text {
      font-size: 26rpx;
      color: #FF6B6B;
    }
  }

  .login-btn {
    width: 100%;
    padding: 28rpx 0;
    margin-top: 32rpx;
    background: #6C5CE7;
    color: #fff;
    font-size: 34rpx;
    font-weight: 600;
    border-radius: 60rpx;
    border: none;
    
    &:disabled {
      opacity: 0.4;
    }
  }

  .register-link {
    text-align: center;
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #636E72;
    
    .link {
      color: #6C5CE7;
      font-weight: 600;
    }
  }
}
</style>