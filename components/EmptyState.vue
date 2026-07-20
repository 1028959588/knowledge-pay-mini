<template>
  <view class="empty-state" :style="{ paddingTop: paddingTop + 'rpx' }">
    <text class="empty-icon">{{ icon || '📭' }}</text>
    <text class="empty-title">{{ title || '暂无数据' }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
    <button v-if="actionText" class="empty-btn" @tap="onAction">
      {{ actionText }}
    </button>
  </view>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  desc: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  paddingTop: {
    type: Number,
    default: 120
  }
})

const emit = defineEmits(['action'])

const onAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .empty-icon {
    font-size: 80rpx;
    display: block;
  }
  
  .empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #2D3436;
    margin-top: 20rpx;
    display: block;
  }
  
  .empty-desc {
    font-size: 26rpx;
    color: #B2BEC3;
    margin-top: 12rpx;
    display: block;
  }
  
  .empty-btn {
    margin-top: 30rpx;
    padding: 16rpx 48rpx;
    background: #6C5CE7;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    border: none;
    
    &:active {
      opacity: 0.8;
    }
  }
}
</style>