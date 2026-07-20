<template>
  <view class="recharge-page">
    <!-- ===== 积分余额 ===== -->
    <view class="balance-card">
      <text class="balance-label">当前积分</text>
      <text class="balance-number">{{ currentPoints }}</text>
      <text class="balance-rate">1元 = 10积分</text>
    </view>

    <!-- ===== 充值套餐 ===== -->
    <view class="package-section">
      <text class="section-title">选择充值套餐</text>
      
      <view class="package-grid">
        <view 
          class="package-item" 
          v-for="pkg in packages" 
          :key="pkg.id"
          :class="{ active: selectedPackage === pkg.id }"
          @tap="selectPackage(pkg.id)"
        >
          <text class="package-price">¥{{ pkg.price }}</text>
          <text class="package-points">+{{ pkg.points }} 积分</text>
          <text v-if="pkg.bonus" class="package-bonus">🎁 送 {{ pkg.bonus }} 积分</text>
        </view>
      </view>
    </view>

    <!-- ===== 支付按钮 ===== -->
    <view class="pay-section">
      <view class="pay-info">
        <text>需支付</text>
        <text class="pay-amount">¥{{ selectedPackageData ? selectedPackageData.price : 0 }}</text>
        <text>获得 {{ selectedPackageData ? selectedPackageData.points + (selectedPackageData.bonus || 0) : 0 }} 积分</text>
      </view>
      <button class="pay-btn" @tap="handlePay" :disabled="!selectedPackage || paying">
        {{ paying ? '支付中...' : '立即充值' }}
      </button>
    </view>

    <!-- ===== 充值记录入口 ===== -->
    <view class="records-entry" @tap="goToRecords">
      <text>查看充值记录</text>
      <text>›</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'  // ✅ ref 和 computed 从 vue 导入
import { onShow } from '@dcloudio/uni-app'  // ✅ onShow 从 uni-app 导入
import { pointsAPI, userAPI } from '@/utils/api.js'

// ===== 充值套餐 =====
const packages = [
  { id: 1, price: 1, points: 10, bonus: 0 },
  { id: 2, price: 6, points: 60, bonus: 10 },
  { id: 3, price: 12, points: 120, bonus: 30 },
  { id: 4, price: 30, points: 300, bonus: 80 },
  { id: 5, price: 68, points: 680, bonus: 200 },
  { id: 6, price: 128, points: 1280, bonus: 500 },
]

// ===== 响应式数据 =====
const currentPoints = ref(0)
const selectedPackage = ref(null)
const paying = ref(false)

// ===== 计算属性 =====
const selectedPackageData = computed(() => {
  return packages.find(p => p.id === selectedPackage.value)
})

// ===== 生命周期 =====
onShow(() => {
  loadBalance()
})

// ===== 方法 =====
const loadBalance = async () => {
  try {
    const res = await userAPI.profile()
    currentPoints.value = res.data.points || 0
  } catch (err) {
    console.error('获取积分失败:', err)
    const info = uni.getStorageSync('userInfo') || {}
    currentPoints.value = info.points || 0
  }
}

const selectPackage = (id) => {
  selectedPackage.value = id
}

const handlePay = async () => {
  if (!selectedPackage.value) {
    uni.showToast({ title: '请选择充值套餐', icon: 'none' })
    return
  }
  
  const pkg = selectedPackageData.value
  const totalPoints = pkg.points + (pkg.bonus || 0)
  
  uni.showModal({
    title: '确认充值',
    content: `支付 ¥${pkg.price}，获得 ${totalPoints} 积分`,
    confirmText: '确认支付',
    success: async (res) => {
      if (res.confirm) {
        await doPay(pkg)
      }
    }
  })
}

const doPay = async (pkg) => {
  paying.value = true
  uni.showLoading({ title: '创建订单...', mask: true })
  
  try {
    // 1. 创建订单
    const orderRes = await pointsAPI.createRecharge(pkg.price)
    console.log('订单创建成功:', orderRes)
    
    uni.showLoading({ title: '支付中...', mask: true })
    
    // 2. 模拟支付（实际对接微信支付）
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 3. 支付确认（模拟）
    const payRes = await pointsAPI.payRecharge(orderRes.data.orderId)
    console.log('支付成功:', payRes)
    
    uni.hideLoading()
    
    // 4. 更新积分
    currentPoints.value = payRes.data.points
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.points = payRes.data.points
    uni.setStorageSync('userInfo', userInfo)
    
    uni.showToast({ 
      title: `充值成功！获得 ${payRes.data.gained} 积分`, 
      icon: 'success' 
    })
    
    selectedPackage.value = null
    
  } catch (err) {
    uni.hideLoading()
    console.error('支付失败:', err)
    uni.showToast({ title: err.message || '支付失败，请重试', icon: 'none' })
  } finally {
    paying.value = false
  }
}

const goToRecords = () => {
  uni.navigateTo({ url: '/pages/records/recharge' })
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.recharge-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #F5F6FA;
}

.balance-card {
  background: $primary-gradient;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 12rpx 40rpx rgba(108, 92, 231, 0.3);
  
  .balance-label {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
  }
  
  .balance-number {
    font-size: 64rpx;
    font-weight: 700;
    color: #fff;
    display: block;
    margin: 8rpx 0;
  }
  
  .balance-rate {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}

.package-section {
  margin-top: 30rpx;
  
  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    
    .package-item {
      background: #fff;
      border-radius: 20rpx;
      padding: 28rpx 16rpx;
      text-align: center;
      border: 3rpx solid transparent;
      transition: all 0.3s ease;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
      
      &:active {
        transform: scale(0.96);
      }
      
      .package-price {
        font-size: 40rpx;
        font-weight: 700;
        color: $text-primary;
        display: block;
      }
      
      .package-points {
        font-size: 26rpx;
        color: $text-secondary;
        display: block;
        margin-top: 8rpx;
      }
      
      .package-bonus {
        font-size: 22rpx;
        color: #FF6B6B;
        display: block;
        margin-top: 4rpx;
      }
      
      &.active {
        border-color: $primary;
        background: rgba(108, 92, 231, 0.05);
        box-shadow: 0 4rpx 24rpx rgba(108, 92, 231, 0.15);
        
        .package-price {
          color: $primary;
        }
      }
    }
  }
}

.pay-section {
  margin-top: 40rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .pay-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    font-size: 28rpx;
    color: $text-secondary;
    
    .pay-amount {
      font-size: 40rpx;
      font-weight: 700;
      color: $text-primary;
    }
  }
  
  .pay-btn {
    width: 100%;
    padding: 28rpx 0;
    background: $primary-gradient;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 60rpx;
    border: none;
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
}

.records-entry {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
  padding: 24rpx 30rpx;
  background: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: $text-secondary;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  &:active {
    opacity: 0.6;
  }
  
  text:last-child {
    font-size: 32rpx;
    color: $text-hint;
  }
}
</style>