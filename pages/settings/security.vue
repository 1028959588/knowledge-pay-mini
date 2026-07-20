<template>
  <view class="security-page">
    <!-- ===== 安全设置列表 ===== -->
    <view class="menu-list">
      <view class="menu-item" @tap="changePassword">
        <view class="menu-left">
          <text class="menu-icon">🔑</text>
          <view class="menu-info">
            <text class="menu-title">修改密码</text>
            <text class="menu-desc">定期修改密码保障账号安全</text>
          </view>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      
      <view class="menu-item" @tap="bindPhone">
        <view class="menu-left">
          <text class="menu-icon">📱</text>
          <view class="menu-info">
            <text class="menu-title">绑定手机</text>
            <text class="menu-desc">{{ userInfo.phone ? '已绑定 ' + userInfo.phone : '未绑定' }}</text>
          </view>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- ===== 修改密码弹窗 ===== -->
    <view class="modal-mask" v-if="showPasswordModal" @tap="closePasswordModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">🔐 修改密码</text>
        
        <view class="modal-form">
          <view class="modal-item">
            <text class="modal-label">当前密码</text>
            <input 
              class="modal-input" 
              type="password" 
              placeholder="请输入当前密码" 
              v-model="oldPassword"
              password
            />
          </view>
          <view class="modal-item">
            <text class="modal-label">新密码</text>
            <input 
              class="modal-input" 
              type="password" 
              placeholder="请输入新密码（至少6位）" 
              v-model="newPassword"
              password
            />
          </view>
          <view class="modal-item">
            <text class="modal-label">确认密码</text>
            <input 
              class="modal-input" 
              type="password" 
              placeholder="请再次输入新密码" 
              v-model="confirmPassword"
              password
            />
          </view>
        </view>
        
        <view class="modal-actions">
          <button class="modal-btn cancel" @tap="closePasswordModal">取消</button>
          <button class="modal-btn confirm" @tap="handleChangePassword" :disabled="changingPassword">
            {{ changingPassword ? '修改中...' : '确认修改' }}
          </button>
        </view>
      </view>
    </view>

    <!-- ===== 绑定手机弹窗 ===== -->
    <view class="modal-mask" v-if="showPhoneModal" @tap="closePhoneModal">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">{{ userInfo.phone ? '📱 更换手机号' : '📱 绑定手机号' }}</text>
        
        <view class="modal-form">
          <view class="modal-item">
            <text class="modal-label">手机号</text>
            <input 
              class="modal-input" 
              type="number" 
              maxlength="11"
              placeholder="请输入手机号" 
              v-model="newPhone"
              @input="onPhoneInput"
            />
          </view>
          <view class="modal-item code-item">
            <text class="modal-label">验证码</text>
            <input 
              class="modal-input" 
              type="number" 
              maxlength="6"
              placeholder="请输入验证码" 
              v-model="smsCode"
              @input="onCodeInput"
            />
            <button 
              class="code-btn" 
              @tap="sendSmsCode" 
              :disabled="smsCountdown > 0 || newPhone.length !== 11"
            >
              {{ smsCountdown > 0 ? smsCountdown + 's' : '获取验证码' }}
            </button>
          </view>
        </view>
        
        <view class="modal-actions">
          <button class="modal-btn cancel" @tap="closePhoneModal">取消</button>
          <button class="modal-btn confirm" @tap="handleBindPhone" :disabled="bindingPhone">
            {{ bindingPhone ? '绑定中...' : '确认绑定' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'  // ✅ ref 从 vue 导入
import { onShow } from '@dcloudio/uni-app'  // ✅ onShow 从 uni-app 导入
import { userAPI } from '@/utils/api.js'

// ============================================================
// 响应式数据
// ============================================================
const userInfo = ref({
  phone: ''
})

// 修改密码
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)

// 绑定手机
const showPhoneModal = ref(false)
const newPhone = ref('')
const smsCode = ref('')
const smsCountdown = ref(0)
const bindingPhone = ref(false)

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadUserInfo()
})

// ============================================================
// 加载用户信息
// ============================================================
const loadUserInfo = async () => {
  try {
    const res = await userAPI.profile()
    userInfo.value = res.data
  } catch (err) {
    console.error('获取用户信息失败:', err)
    const info = uni.getStorageSync('userInfo') || {}
    userInfo.value = info
  }
}

// ============================================================
// 输入处理
// ============================================================
const onPhoneInput = () => {
  newPhone.value = newPhone.value.replace(/\D/g, '')
}

const onCodeInput = () => {
  smsCode.value = smsCode.value.replace(/\D/g, '')
}

// ============================================================
// 修改密码
// ============================================================
const changePassword = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
}

const handleChangePassword = async () => {
  // 验证
  if (!oldPassword.value) {
    uni.showToast({ title: '请输入当前密码', icon: 'none' })
    return
  }
  if (!newPassword.value || newPassword.value.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  changingPassword.value = true
  
  try {
    await userAPI.changePassword(oldPassword.value, newPassword.value)
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    closePasswordModal()
  } catch (err) {
    console.error('修改密码失败:', err)
    uni.showToast({ title: err.message || '修改失败', icon: 'none' })
  } finally {
    changingPassword.value = false
  }
}

// ============================================================
// 绑定手机
// ============================================================
const bindPhone = () => {
  newPhone.value = ''
  smsCode.value = ''
  showPhoneModal.value = true
}

const closePhoneModal = () => {
  showPhoneModal.value = false
}

const sendSmsCode = async () => {
  if (newPhone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  
  try {
    const res = await userAPI.sendCode(newPhone.value)
    console.log('验证码发送成功:', res)
    
    if (res.data && res.data.code) {
      uni.showToast({ title: `验证码: ${res.data.code}`, icon: 'none', duration: 3000 })
    } else {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
    }
    
    // 倒计时
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (err) {
    console.error('发送验证码失败:', err)
    uni.showToast({ title: err.message || '发送失败', icon: 'none' })
  }
}

const handleBindPhone = async () => {
  if (newPhone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!smsCode.value || smsCode.value.length < 4) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  
  bindingPhone.value = true
  
  try {
    const res = await userAPI.bindPhone(newPhone.value, smsCode.value)
    console.log('绑定成功:', res)
    
    // 更新本地缓存
    const info = uni.getStorageSync('userInfo') || {}
    info.phone = newPhone.value
    uni.setStorageSync('userInfo', info)
    userInfo.value.phone = newPhone.value
    
    uni.showToast({ title: '绑定成功', icon: 'success' })
    closePhoneModal()
  } catch (err) {
    console.error('绑定失败:', err)
    uni.showToast({ title: err.message || '绑定失败', icon: 'none' })
  } finally {
    bindingPhone.value = false
  }
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.security-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.menu-list {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 30rpx;
    border-bottom: 1rpx solid #F0F2F8;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background: #F8F9FF;
    }
    
    .menu-left {
      display: flex;
      align-items: center;
      
      .menu-icon {
        font-size: 36rpx;
        margin-right: 20rpx;
      }
      
      .menu-info {
        .menu-title {
          font-size: 28rpx;
          color: $text-primary;
          display: block;
        }
        
        .menu-desc {
          font-size: 22rpx;
          color: $text-hint;
          display: block;
          margin-top: 2rpx;
        }
      }
    }
    
    .menu-arrow {
      font-size: 32rpx;
      color: $text-hint;
    }
  }
}

// ===== 弹窗样式 =====
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 60rpx;
  
  .modal-content {
    width: 100%;
    max-width: 600rpx;
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx 30rpx 30rpx;
    
    .modal-title {
      font-size: 34rpx;
      font-weight: 700;
      color: $text-primary;
      display: block;
      text-align: center;
      margin-bottom: 30rpx;
    }
    
    .modal-form {
      .modal-item {
        display: flex;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1rpx solid #F0F2F8;
        
        .modal-label {
          font-size: 26rpx;
          color: $text-secondary;
          width: 120rpx;
          flex-shrink: 0;
        }
        
        .modal-input {
          flex: 1;
          font-size: 28rpx;
          color: $text-primary;
          padding: 8rpx 0;
        }
      }
      
      .code-item {
        .code-btn {
          font-size: 22rpx;
          color: $primary;
          background: none;
          border: none;
          padding: 8rpx 16rpx;
          flex-shrink: 0;
          
          &:disabled {
            color: $text-hint;
          }
        }
      }
    }
    
    .modal-actions {
      display: flex;
      gap: 16rpx;
      margin-top: 30rpx;
      
      .modal-btn {
        flex: 1;
        padding: 24rpx 0;
        border-radius: 50rpx;
        font-size: 28rpx;
        border: none;
        
        &.cancel {
          background: #F5F6FA;
          color: $text-secondary;
        }
        
        &.confirm {
          background: $primary;
          color: #fff;
          
          &:disabled {
            opacity: 0.5;
          }
        }
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }
}
</style>