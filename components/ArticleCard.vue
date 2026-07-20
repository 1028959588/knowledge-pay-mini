<!-- components/ArticleCard.vue -->
<template>
  <view class="article-card" @tap="goToDetail">
    <!-- 封面图 -->
    <image class="cover" :src="article.cover || '/static/default-cover.png'" mode="aspectFill" />
    
    <!-- 标签 -->
    <view class="tag" :class="tagClass">
      {{ tagText }}
    </view>
    
    <!-- 内容信息 -->
    <view class="info">
      <text class="title">{{ article.title }}</text>
      <text class="summary">{{ article.summary }}</text>
      
      <view class="meta">
        <view class="meta-left">
          <text class="meta-icon">👁️</text>
          <text class="meta-text">{{ article.view_count || 0 }}</text>
          <text class="meta-icon" style="margin-left: 16rpx;">❤️</text>
          <text class="meta-text">{{ article.pay_count || 0 }}</text>
        </view>
        <text class="meta-time">{{ formatDate(article.publish_time) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const tagClass = computed(() => {
  return props.article.type === 1 ? 'tag-free' : 'tag-pay'
})

const tagText = computed(() => {
  if (props.article.type === 1) return '免费'
  return `${props.article.points_required || 0}积分`
})

const formatDate = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth()+1}/${date.getDate()}`
}

const goToDetail = () => {
  uni.navigateTo({ 
    url: `/pages/article/detail?id=${props.article.id}` 
  })
}
</script>

<style lang="scss" scoped>
.article-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  position: relative;
  
  .cover {
    width: 100%;
    height: 200rpx;
  }
  
  .tag {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: #fff;
    
    &.tag-free {
      background: #1DD1A1;
    }
    
    &.tag-pay {
      background: #FF6B6B;
    }
  }
  
  .info {
    padding: 20rpx 24rpx 24rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
      color: #2D3436;
      display: block;
      line-height: 1.4;
    }
    
    .summary {
      font-size: 26rpx;
      color: #636E72;
      display: block;
      margin-top: 8rpx;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16rpx;
      
      .meta-left {
        display: flex;
        align-items: center;
        
        .meta-icon {
          font-size: 22rpx;
        }
        
        .meta-text {
          font-size: 22rpx;
          color: #B2BEC3;
          margin-left: 4rpx;
        }
      }
      
      .meta-time {
        font-size: 22rpx;
        color: #B2BEC3;
      }
    }
  }
}
</style>