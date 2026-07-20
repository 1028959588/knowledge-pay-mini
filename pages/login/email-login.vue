<template>
  <view class="email-login-page">
    <!-- 欢迎区域 -->
    <view class="welcome-section">
      <text class="welcome-title">欢迎回来</text>
      <text class="welcome-desc">使用邮箱快速登录或注册</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-wrapper">
      <view 
        class="tab-item" 
        :class="{ active: loginType === 'code' }"
        @tap="loginType = 'code'"
      >
        <text class="tab-icon">📱</text>
        <text class="tab-text">验证码登录</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: loginType === 'password' }"
        @tap="loginType = 'password'"
      >
        <text class="tab-icon">🔒</text>
        <text class="tab-text">密码登录</text>
      </view>
    </view>

    <!-- ===== 验证码登录 ===== -->
    <view v-if="loginType === 'code'" class="form-section">
      <!-- 邮箱输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-icon">📧</text>
          <text class="label-text">邮箱地址</text>
        </view>
        <view class="input-wrapper" :class="{ focused: emailFocused }">
          <input 
            class="input-field" 
            type="text"
            placeholder="请输入邮箱地址" 
            placeholder-class="input-placeholder"
            v-model="email"
            @focus="emailFocused = true"
            @blur="emailFocused = false"
            @input="clearError"
          />
          <text v-if="emailValid" class="input-check">✅</text>
        </view>
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-icon">✉️</text>
          <text class="label-text">验证码</text>
        </view>
        <view class="input-wrapper code-wrapper" :class="{ focused: codeFocused }">
          <input 
            class="input-field code-field" 
            type="number"
            maxlength="6"
            placeholder="请输入6位验证码" 
            placeholder-class="input-placeholder"
            v-model="code"
            @focus="codeFocused = true"
            @blur="codeFocused = false"
            @input="clearError"
          />
          <button 
            class="code-btn" 
            @tap="sendCode" 
            :disabled="countdown > 0 || !emailValid"
            :class="{ 
              active: countdown === 0 && emailValid,
              sending: countdown > 0
            }"
          >
            {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
          </button>
        </view>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMessage" class="error-tip">
        <text class="error-icon">⚠️</text>
        <text class="error-text">{{ errorMessage }}</text>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" @tap="handleCodeLogin" :disabled="submitting">
        <text v-if="submitting" class="btn-loading">⏳</text>
        <text>{{ submitting ? '登录中...' : '登 录' }}</text>
      </button>

      <!-- 底部提示 -->
      <view class="form-footer">
        <text class="footer-tip">💡 首次登录将自动注册账号</text>
      </view>
    </view>

    <!-- ===== 密码登录 ===== -->
    <view v-else class="form-section">
      <!-- 邮箱输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-icon">📧</text>
          <text class="label-text">邮箱地址</text>
        </view>
        <view class="input-wrapper" :class="{ focused: emailFocused }">
          <input 
            class="input-field" 
            type="text"
            placeholder="请输入邮箱地址" 
            placeholder-class="input-placeholder"
            v-model="email"
            @focus="emailFocused = true"
            @blur="emailFocused = false"
            @input="clearError"
          />
          <text v-if="emailValid" class="input-check">✅</text>
        </view>
      </view>

      <!-- 密码输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-icon">🔑</text>
          <text class="label-text">密码</text>
        </view>
        <view class="input-wrapper password-wrapper" :class="{ focused: passwordFocused }">
          <input 
            class="input-field" 
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码（至少6位）" 
            placeholder-class="input-placeholder"
            v-model="password"
            @focus="passwordFocused = true"
            @blur="passwordFocused = false"
            @input="clearError"
          />
          <text class="password-toggle" @tap="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </text>
        </view>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMessage" class="error-tip">
        <text class="error-icon">⚠️</text>
        <text class="error-text">{{ errorMessage }}</text>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" @tap="handlePasswordLogin" :disabled="submitting">
        <text v-if="submitting" class="btn-loading">⏳</text>
        <text>{{ submitting ? '登录中...' : '登 录' }}</text>
      </button>

      <!-- 底部操作 -->
      <view class="form-footer">
        <text class="footer-tip">还没有密码？</text>
        <text class="footer-link" @tap="goToSetPassword">设置密码 →</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api.js'
import { setLoginState } from '@/utils/store.js'

// ============================================================
// 响应式数据
// ============================================================
const loginType = ref('code')
const email = ref('')
const code = ref('')
const password = ref('')
const showPassword = ref(false)
const countdown = ref(0)
const submitting = ref(false)
const errorMessage = ref('')
const emailFocused = ref(false)
const codeFocused = ref(false)
const passwordFocused = ref(false)

// ============================================================
// 计算属性
// ============================================================
const emailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

// ============================================================
// 方法
// ============================================================
const clearError = () => {
  errorMessage.value = ''
}

// ============================================================
// 发送验证码
// ============================================================
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

// ============================================================
// ✅ 验证码登录 - 成功后直接进入 App
// ============================================================
const handleCodeLogin = async () => {
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
    const res = await authAPI.emailLogin(email.value, code.value)
    console.log('登录成功:', res)
    
    // ✅ 保存登录状态
    setLoginState(res.data.token, res.data.userInfo)
    
    // ✅ 如果是新用户，在 App 内提示设置密码（不阻断登录）
    if (res.data.isNewUser) {
      // 先进入首页
      uni.switchTab({ url: '/pages/index/index' })
      
      // 延迟弹出设置密码提示
      setTimeout(() => {
        uni.showModal({
          title: '🔐 设置密码',
          content: '为了账号安全，建议您设置登录密码，方便下次使用密码登录',
          confirmText: '去设置',
          cancelText: '稍后',
          success: (modalRes) => {
            if (modalRes.confirm) {
              uni.navigateTo({ 
                url: `/pages/login/set-password?email=${encodeURIComponent(email.value)}` 
              })
            }
          }
        })
      }, 500)
    } else {
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 500)
    }
  } catch (err) {
    errorMessage.value = err.message || '登录失败'
  } finally {
    submitting.value = false
  }
}

// ============================================================
// 密码登录
// ============================================================
const handlePasswordLogin = async () => {
  if (!emailValid.value) {
    errorMessage.value = '请输入正确的邮箱地址'
    return
  }
  if (!password.value || password.value.length < 6) {
    errorMessage.value = '密码至少6位'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    const res = await authAPI.emailPasswordLogin(email.value, password.value)
    console.log('密码登录成功:', res)
    
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

// ============================================================
// 导航
// ============================================================
const goBack = () => {
  uni.navigateBack()
}

const goToSetPassword = () => {
  if (!emailValid.value) {
    errorMessage.value = '请先输入邮箱地址'
    return
  }
  uni.navigateTo({ 
    url: `/pages/login/set-password?email=${encodeURIComponent(email.value)}` 
  })
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

.email-login-page {
  min-height: 100vh;
  padding: 0 32rpx 40rpx;
  background: $bg-color;
}

.welcome-section {
  padding: 30rpx 0 20rpx;
  
  .welcome-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-primary;
    display: block;
  }
  
  .welcome-desc {
    font-size: 26rpx;
    color: $text-hint;
    display: block;
    margin-top: 8rpx;
  }
}

.tab-wrapper {
  display: flex;
  background: #fff;
  border-radius: 60rpx;
  padding: 6rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
  
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20rpx 0;
    border-radius: 60rpx;
    transition: all 0.3s ease;
    gap: 10rpx;
    
    .tab-icon {
      font-size: 28rpx;
    }
    
    .tab-text {
      font-size: 28rpx;
      color: $text-secondary;
      font-weight: 500;
    }
    
    &.active {
      background: $primary-gradient;
      box-shadow: 0 4rpx 16rpx rgba(108,92,231,0.25);
      
      .tab-text {
        color: #fff;
      }
    }
  }
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
}

.input-group {
  margin-bottom: 24rpx;
  
  .input-label {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
    
    .label-icon {
      font-size: 28rpx;
      margin-right: 10rpx;
    }
    
    .label-text {
      font-size: 26rpx;
      font-weight: 500;
      color: $text-secondary;
    }
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    background: #F5F7FA;
    border-radius: 16rpx;
    padding: 0 20rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    
    &.focused {
      background: #fff;
      border-color: $primary;
      box-shadow: 0 0 0 4rpx rgba(108,92,231,0.08);
    }
    
    .input-field {
      flex: 1;
      height: 88rpx;
      font-size: 30rpx;
      color: $text-primary;
      
      &::placeholder {
        color: $text-hint;
      }
    }
    
    .input-check {
      font-size: 28rpx;
      color: $success;
    }
  }
  
  .code-wrapper {
    .code-field {
      flex: 1;
    }
    
    .code-btn {
      font-size: 24rpx;
      color: $text-hint;
      background: transparent;
      border: none;
      padding: 12rpx 16rpx;
      flex-shrink: 0;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &.active {
        color: $primary;
        &:active { opacity: 0.6; }
      }
      
      &.sending {
        color: $text-hint;
      }
      
      &:disabled { opacity: 0.5; }
    }
  }
  
  .password-wrapper {
    .password-toggle {
      font-size: 32rpx;
      padding: 8rpx 8rpx 8rpx 16rpx;
      opacity: 0.5;
      &:active { opacity: 0.8; }
    }
  }
}

.error-tip {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #FFF0F0;
  border-radius: 12rpx;
  margin-top: 8rpx;
  gap: 12rpx;
  
  .error-icon { font-size: 28rpx; }
  .error-text {
    flex: 1;
    font-size: 26rpx;
    color: $danger;
  }
}

.login-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32rpx;
  background: $primary-gradient;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 60rpx;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(108,92,231,0.3);
  gap: 12rpx;
  
  .btn-loading { font-size: 32rpx; }
  &:active { transform: scale(0.97); opacity: 0.9; }
  &:disabled { opacity: 0.4; transform: scale(1); box-shadow: none; }
}

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24rpx;
  gap: 8rpx;
  
  .footer-tip {
    font-size: 24rpx;
    color: $text-hint;
  }
  
  .footer-link {
    font-size: 24rpx;
    color: $primary;
    font-weight: 600;
    &:active { opacity: 0.6; }
  }
}
</style>