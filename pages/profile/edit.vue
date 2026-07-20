<template>
  <view class="edit-page">
    <!-- ===== 头像区域 ===== -->
    <view class="avatar-section" @tap="changeAvatar">
      <view class="avatar-wrapper">
        <image 
          class="avatar" 
          :src="form.avatar || DEFAULT_AVATAR" 
          mode="aspectFill"
          @error="onAvatarError"
        />
        <view class="avatar-mask">
          <text class="mask-icon">📷</text>
          <text class="mask-text">更换头像</text>
        </view>
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <!-- ===== 上传进度 ===== -->
    <view v-if="uploading" class="upload-progress">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
      </view>
      <text class="progress-text">{{ uploadProgress }}%</text>
    </view>

    <!-- ===== 表单 ===== -->
    <view class="form-section">
      <!-- 昵称 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-icon">👤</text>
          <text class="label-text">昵称</text>
        </view>
        <input 
          class="form-input" 
          placeholder="请输入昵称" 
          placeholder-class="input-placeholder"
          v-model="form.nickname"
          maxlength="20"
          @input="onNicknameInput"
        />
        <text class="form-count">{{ form.nickname.length }}/20</text>
      </view>
      
      <!-- 邮箱（只读显示） -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-icon">📧</text>
          <text class="label-text">邮箱</text>
        </view>
        <text class="form-text">{{ form.email || '未绑定' }}</text>
        <text class="form-action" @tap="goToChangeEmail">更换</text>
      </view>

      <!-- 密码 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-icon">🔑</text>
          <text class="label-text">密码</text>
        </view>
        <text class="form-text" :class="{ 'has-password': form.hasPassword }">
          {{ form.hasPassword ? '已设置' : '未设置' }}
        </text>
        <text class="form-action" @tap="goToSetPassword">
          {{ form.hasPassword ? '修改' : '设置' }}
        </text>
      </view>
    </view>

    <!-- ===== 微信快捷获取 ===== -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="wx-quick-section" @tap="getWxUserInfo">
      <view class="wx-quick-btn">
        <text class="wx-icon-text">💬</text>
        <text class="wx-btn-text">一键获取微信头像和昵称</text>
      </view>
      <text class="wx-quick-tip">点击后需要授权微信信息</text>
    </view>
    <!-- #endif -->

    <!-- ===== 底部操作栏 ===== -->
    <view class="bottom-actions">
      <button class="btn-cancel" @tap="goBack">取消</button>
      <button 
        class="btn-save" 
        @tap="handleSave" 
        :disabled="!hasChanged || saving || uploading"
        :class="{ active: hasChanged && !saving && !uploading }"
      >
        <text v-if="saving">⏳ 保存中...</text>
        <text v-else-if="!hasChanged">✓ 无修改</text>
        <text v-else>💾 保存资料</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userAPI } from '@/utils/api.js'
import { uploadAvatar } from '@/utils/upload.js'
import { updateUserInfo } from '@/utils/store.js'

// ============================================================
// 默认头像
// ============================================================
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236C5CE7"/%3E%3Ctext x="100" y="130" font-size="80" text-anchor="middle" fill="white" font-family="Arial"%3E📚%3C/text%3E%3C/svg%3E'

// ============================================================
// 响应式数据
// ============================================================
const form = ref({
  nickname: '',
  avatar: '',
  email: '',
  hasPassword: false
})
const saving = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const originalData = ref({
  nickname: '',
  avatar: ''
})

// ============================================================
// 计算属性
// ============================================================
const hasChanged = computed(() => {
  return form.value.nickname !== originalData.value.nickname ||
         form.value.avatar !== originalData.value.avatar
})

// ============================================================
// 生命周期
// ============================================================
onShow(() => {
  loadUserInfo()
})

// ============================================================
// 头像加载失败
// ============================================================
const onAvatarError = () => {
  form.value.avatar = DEFAULT_AVATAR
}

// ============================================================
// 加载用户信息
// ============================================================
const loadUserInfo = async () => {
  try {
    const res = await userAPI.profile()
    console.log('加载用户信息:', res.data)
    
    // ✅ 确保所有字段都正确赋值
    const data = res.data
    form.value = {
      nickname: data.nickname || '',
      avatar: data.avatar || DEFAULT_AVATAR,
      email: data.email || '',
      hasPassword: data.hasPassword || false
    }
    
    // 更新缓存
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.email = data.email || ''
    userInfo.hasPassword = data.hasPassword || false
    uni.setStorageSync('userInfo', userInfo)
    
    originalData.value = {
      nickname: data.nickname || '',
      avatar: data.avatar || ''
    }
  } catch (err) {
    console.error('加载用户信息失败:', err)
    // 从缓存读取
    const info = uni.getStorageSync('userInfo') || {}
    form.value = {
      nickname: info.nickname || '',
      avatar: info.avatar || DEFAULT_AVATAR,
      email: info.email || '',
      hasPassword: info.hasPassword || false
    }
    originalData.value = {
      nickname: info.nickname || '',
      avatar: info.avatar || ''
    }
  }
}

// ============================================================
// 昵称输入
// ============================================================
const onNicknameInput = () => {
  if (form.value.nickname.length > 20) {
    form.value.nickname = form.value.nickname.slice(0, 20)
  }
}

// ============================================================
// 更换头像
// ============================================================
const changeAvatar = () => {
  const actions = ['拍照', '从相册选择']
  // #ifdef MP-WEIXIN
  actions.push('使用微信头像')
  // #endif
  
  uni.showActionSheet({
    itemList: actions,
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.chooseImage({
          count: 1,
          sourceType: ['camera'],
          success: (imgRes) => {
            uploadAvatarFile(imgRes.tempFilePaths[0])
          }
        })
      } else if (res.tapIndex === 1) {
        uni.chooseImage({
          count: 1,
          sourceType: ['album'],
          success: (imgRes) => {
            uploadAvatarFile(imgRes.tempFilePaths[0])
          }
        })
      } else if (res.tapIndex === 2) {
        // #ifdef MP-WEIXIN
        getWxUserInfo()
        // #endif
      }
    }
  })
}

// ============================================================
// 上传头像到 OSS
// ============================================================
const uploadAvatarFile = async (tempFilePath) => {
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const result = await uploadAvatar(tempFilePath, (progress) => {
      uploadProgress.value = progress
    })
    
    console.log('✅ 头像上传成功:', result)
    form.value.avatar = result.url
    
    uni.showToast({ title: '头像上传成功 ✅', icon: 'success' })
    
  } catch (err) {
    console.error('❌ 上传失败:', err)
    uni.showToast({ 
      title: err.message || '上传失败，请重试', 
      icon: 'none',
      duration: 2000
    })
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// ============================================================
// 微信一键获取
// ============================================================
// #ifdef MP-WEIXIN
const getWxUserInfo = () => {
  uni.getUserProfile({
    desc: '用于完善个人资料',
    success: (res) => {
      console.log('✅ 获取微信用户信息成功:', res.userInfo)
      
      const { nickName, avatarUrl } = res.userInfo
      
      if (nickName) {
        form.value.nickname = nickName
      }
      if (avatarUrl) {
        form.value.avatar = avatarUrl
      }
      
      uni.showToast({ 
        title: '已获取微信信息', 
        icon: 'success',
        duration: 1500
      })
    },
    fail: (err) => {
      console.error('❌ 获取微信用户信息失败:', err)
      uni.showModal({
        title: '提示',
        content: '需要获取您的微信头像和昵称，是否重新授权？',
        confirmText: '去授权',
        success: (modalRes) => {
          if (modalRes.confirm) {
            getWxUserInfo()
          }
        }
      })
    }
  })
}
// #endif

// ============================================================
// 保存资料
// ============================================================
const handleSave = async () => {
  if (!form.value.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  
  if (!hasChanged.value) {
    uni.showToast({ title: '没有修改任何内容', icon: 'none' })
    return
  }
  
  saving.value = true
  
  try {
    const updateData = {
      nickname: form.value.nickname.trim()
    }
    
    if (form.value.avatar && form.value.avatar !== originalData.value.avatar) {
      updateData.avatar = form.value.avatar
    }
    
    const res = await userAPI.update(updateData)
    console.log('✅ 保存成功:', res)
    
    // 更新缓存和 store
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.nickname = form.value.nickname.trim()
    if (updateData.avatar) {
      userInfo.avatar = form.value.avatar
    }
    uni.setStorageSync('userInfo', userInfo)
    updateUserInfo(userInfo)
    
    originalData.value = {
      nickname: form.value.nickname.trim(),
      avatar: form.value.avatar
    }
    
    uni.showToast({ title: '保存成功 ✅', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
    
  } catch (err) {
    console.error('❌ 保存失败:', err)
    uni.showToast({ 
      title: err.message || '保存失败，请重试', 
      icon: 'none' 
    })
  } finally {
    saving.value = false
  }
}

// ============================================================
// 跳转
// ============================================================
const goToChangeEmail = () => {
  uni.navigateTo({ url: '/pages/profile/change-email' })
}

const goToSetPassword = () => {
  uni.navigateTo({ 
    url: `/pages/login/set-password?email=${encodeURIComponent(form.value.email)}` 
  })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-light: #A29BFE;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$success: #1DD1A1;  // ✅ 添加这行
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;
$bg-color: #F5F6FA;

.edit-page {
  min-height: 100vh;
  background: #F5F6FA;
  padding: 0 30rpx 30rpx;
}

// ============================================================
// 头像
// ============================================================
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0 20rpx;
  
  .avatar-wrapper {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8rpx 32rpx rgba(108, 92, 231, 0.2);
    
    .avatar {
      width: 100%;
      height: 100%;
      background: #f0f0f0;
    }
    
    .avatar-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      opacity: 0;
      transition: opacity 0.3s ease;
      
      .mask-icon {
        font-size: 36rpx;
      }
      
      .mask-text {
        font-size: 22rpx;
        margin-top: 4rpx;
      }
    }
    
    &:active .avatar-mask {
      opacity: 1;
    }
  }
  
  .avatar-tip {
    font-size: 24rpx;
    color: $text-hint;
    margin-top: 16rpx;
  }
}

// ============================================================
// 上传进度
// ============================================================
.upload-progress {
  margin: 0 0 20rpx;
  padding: 16rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .progress-bar {
    flex: 1;
    height: 8rpx;
    background: #f0f0f0;
    border-radius: 4rpx;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: $primary-gradient;
      border-radius: 4rpx;
      transition: width 0.3s ease;
    }
  }
  
  .progress-text {
    font-size: 24rpx;
    font-weight: 600;
    color: $primary;
    min-width: 44rpx;
    text-align: right;
  }
}

// ============================================================
// 表单
// ============================================================
.form-section {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .form-item {
    display: flex;
    align-items: center;
    padding: 28rpx 0;
    border-bottom: 1rpx solid #F0F2F8;
    
    &:last-child {
      border-bottom: none;
    }
    
    .form-label {
      display: flex;
      align-items: center;
      width: 140rpx;
      flex-shrink: 0;
      
      .label-icon {
        font-size: 28rpx;
        margin-right: 12rpx;
      }
      
      .label-text {
        font-size: 28rpx;
        color: $text-primary;
      }
    }
    
    .form-input {
      flex: 1;
      font-size: 28rpx;
      color: $text-primary;
      padding: 8rpx 0;
    }
    
    .input-placeholder {
      color: $text-hint;
    }
    
    .form-count {
      font-size: 22rpx;
      color: $text-hint;
      flex-shrink: 0;
      margin-left: 12rpx;
    }
    
    .form-text {
      flex: 1;
      font-size: 28rpx;
      color: $text-secondary;
      
      &.has-password {
        color: $success;
      }
    }
    
    .form-action {
      font-size: 26rpx;
      color: $primary;
      padding: 8rpx 20rpx;
      border: 1rpx solid $primary;
      border-radius: 40rpx;
      
      &:active {
        opacity: 0.6;
        background: rgba(108, 92, 231, 0.05);
      }
    }
  }
}

// ============================================================
// 微信快捷
// ============================================================
.wx-quick-section {
  margin-top: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  &:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
  
  .wx-quick-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    
    .wx-icon-text {
      font-size: 40rpx;
    }
    
    .wx-btn-text {
      font-size: 30rpx;
      font-weight: 500;
      color: #07C160;
    }
  }
  
  .wx-quick-tip {
    display: block;
    font-size: 22rpx;
    color: $text-hint;
    margin-top: 8rpx;
  }
}

// ============================================================
// 底部操作栏
// ============================================================
.bottom-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
  padding: 20rpx 0 40rpx;
  
  .btn-cancel {
    flex: 1;
    padding: 26rpx 0;
    background: transparent;
    color: $text-secondary;
    font-size: 28rpx;
    font-weight: 500;
    border-radius: 50rpx;
    border: 2rpx solid #d0d0d0;
    transition: all 0.3s ease;
    
    &:active {
      background: rgba(0, 0, 0, 0.04);
      transform: scale(0.97);
    }
  }
  
  .btn-save {
    flex: 2;
    padding: 26rpx 0;
    background: #d0d0d0;
    color: #999;
    font-size: 28rpx;
    font-weight: 600;
    border-radius: 50rpx;
    border: none;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.97);
    }
    
    &.active {
      background: $primary-gradient;
      color: #fff;
      box-shadow: 0 6rpx 20rpx rgba(108, 92, 231, 0.3);
      
      &:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
    }
    
    &:disabled {
      opacity: 0.4;
      transform: none;
      box-shadow: none;
    }
  }
}
</style>