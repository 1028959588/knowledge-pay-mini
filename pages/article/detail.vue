<template>
  <view class="detail-page" v-if="article">
    <!-- ===== 封面图 ===== -->
    <image class="cover" :src="article.cover || '/static/default-cover.png'" mode="widthFix" />
    
    <!-- ===== 标题区域 ===== -->
    <view class="header">
      <text class="title">{{ article.title }}</text>
      <text class="subtitle">{{ article.subtitle }}</text>
      
      <view class="meta">
        <text class="meta-tag" :class="article.type === 1 ? 'free' : 'pay'">
          {{ article.type === 1 ? '免费' : article.points_required + '积分' }}
        </text>
        <text class="meta-text">👁️ {{ article.view_count || 0 }}</text>
        <text class="meta-text">❤️ {{ article.pay_count || 0 }}</text>
      </view>
    </view>

    <!-- ===== 内容区域 ===== -->
    <view class="content-wrapper">
      <!-- 试读内容（付费前显示） -->
      <view v-if="!isUnlocked && article.type === 2" class="preview">
        <view class="preview-content" v-html="previewContent"></view>
        
        <!-- 付费遮罩 -->
        <view class="pay-overlay">
          <view class="pay-card">
            <text class="pay-icon">🔒</text>
            <text class="pay-title">付费解锁完整内容</text>
            <text class="pay-desc">仅需 {{ article.points_required }} 积分</text>
            <text class="pay-desc small">解锁后可永久查看</text>
            
            <view class="pay-actions">
              <button class="pay-btn" @tap="handleUnlock" :disabled="unlocking">
                {{ unlocking ? '解锁中...' : '🚀 立即解锁' }}
              </button>
              <view class="pay-bottom">
                <text class="pay-points">当前积分：{{ userPoints }}</text>
                <text class="pay-tip" @tap="goToRecharge">积分不足？去充值</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 完整内容（免费或已解锁） -->
      <view v-else class="full-content" v-html="fullContent"></view>
    </view>

    <!-- ===== 底部操作栏 ===== -->
    <view class="bottom-bar" v-if="isUnlocked || article.type === 1">
      <view class="bar-left">
        <text class="bar-btn" @tap="handleFavorite">
          {{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
        </text>
      </view>
      <view class="bar-right">
        <text class="bar-btn" @tap="handleShare">📤 分享</text>
      </view>
    </view>
  </view>
  
  <!-- 加载中 -->
  <view v-else class="loading">
    <text>加载中...</text>
  </view>
  
	<!-- ===== 底部操作栏 ===== -->
	<view class="bottom-bar" v-if="isUnlocked || article.type === 1">
	  <view class="bar-left">
		<text class="bar-btn" @tap="handleFavorite">
		  {{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
		</text>
		<text class="bar-btn" @tap="toggleComment">💬 评论 ({{ commentCount }})</text>
	  </view>
	  <view class="bar-right">
		<text class="bar-btn" @tap="handleShare">📤 分享</text>
	  </view>
	</view>

	<!-- ===== 评论区域 ===== -->
	<view v-if="showComment" class="comment-wrapper">
	  <CommentSection :articleId="articleId" />
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { articleAPI, userAPI } from '@/utils/api.js'
import CommentSection from '@/components/CommentSection.vue'

// ===== 响应式数据 =====
const article = ref(null)
const isUnlocked = ref(false)
const isFavorited = ref(false)
const userPoints = ref(0)
const articleId = ref(null)
const unlocking = ref(false)

// ===== 计算属性 =====
// 试读内容（取前 300 字符）
const previewContent = computed(() => {
  if (!article.value) return ''
  const content = article.value.content || ''
  const preview = content.slice(0, 300)
  return preview + '<div style="color:#B2BEC3;margin-top:16rpx;">......</div>'
})

// 完整内容
const fullContent = computed(() => {
  if (!article.value) return ''
  return article.value.content || ''
})

// ===== 生命周期 =====
onLoad((options) => {
  if (options.id) {
    articleId.value = parseInt(options.id)
    loadArticle(articleId.value)
  }
})

onShow(() => {
  loadUserInfo()
  checkFavorites()
})

// ===== 方法 =====

// 加载文章
const loadArticle = async (id) => {
  try {
    const res = await articleAPI.detail(id)
    console.log('文章详情:', res.data)
    article.value = res.data
    
    // 检查是否已解锁
    isUnlocked.value = res.data.isUnlocked || false
    
    // 更新用户信息
    if (res.data.userInfo) {
      userPoints.value = res.data.userInfo.points || 0
    }
  } catch (err) {
    console.error('加载文章失败:', err)
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await userAPI.profile()
    userPoints.value = res.data.points || 0
  } catch (err) {
    console.error('获取用户信息失败:', err)
    const info = uni.getStorageSync('userInfo') || {}
    userPoints.value = info.points || 0
  }
}

// 检查收藏状态
const checkFavorites = () => {
  const favorites = uni.getStorageSync('favorites') || []
  isFavorited.value = favorites.includes(articleId.value)
}

// ============================================================
// 付费解锁
// ============================================================
const handleUnlock = async () => {
  if (!article.value) return
  
  // 检查积分是否充足
  if (userPoints.value < article.value.points_required) {
    uni.showModal({
      title: '积分不足',
      content: `解锁需要 ${article.value.points_required} 积分，当前 ${userPoints.value} 积分。去充值获取更多积分？`,
      confirmText: '去充值',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/recharge/recharge' })
        }
      }
    })
    return
  }
  
  // 确认解锁
  uni.showModal({
    title: '确认解锁',
    content: `消耗 ${article.value.points_required} 积分解锁《${article.value.title}》`,
    confirmText: '确认解锁',
    confirmColor: '#6C5CE7',
    success: async (res) => {
      if (res.confirm) {
        await doUnlock()
      }
    }
  })
}

const doUnlock = async () => {
  unlocking.value = true
  
  try {
    const res = await articleAPI.unlock(articleId.value)
    console.log('解锁成功:', res)
    
    isUnlocked.value = true
    userPoints.value = res.data.remainingPoints
    
    // 更新缓存
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.points = res.data.remainingPoints
    uni.setStorageSync('userInfo', userInfo)
    
    // 记录解锁到本地
    const unlockRecords = uni.getStorageSync('unlockRecords') || []
    unlockRecords.push({
      article_id: article.value.id,
      title: article.value.title,
      points_cost: article.value.points_required,
      unlocked_at: new Date().toLocaleString()
    })
    uni.setStorageSync('unlockRecords', unlockRecords)
    
    uni.showToast({ title: '解锁成功 🎉', icon: 'success' })
    
  } catch (err) {
    console.error('解锁失败:', err)
    uni.showToast({ title: err.message || '解锁失败，请重试', icon: 'none' })
  } finally {
    unlocking.value = false
  }
}

// ============================================================
// 收藏
// ============================================================
const handleFavorite = () => {
  const favorites = uni.getStorageSync('favorites') || []
  const index = favorites.indexOf(articleId.value)
  
  if (index > -1) {
    favorites.splice(index, 1)
    isFavorited.value = false
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  } else {
    favorites.push(articleId.value)
    isFavorited.value = true
    uni.showToast({ title: '收藏成功', icon: 'success' })
  }
  
  uni.setStorageSync('favorites', favorites)
}

// ============================================================
// 分享
// ============================================================
const handleShare = () => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
  // #endif
}

// 跳转充值
const goToRecharge = () => {
  uni.navigateTo({ url: '/pages/recharge/recharge' })
}

// ===== 响应式数据 =====
const showComment = ref(false)
const commentCount = ref(0)

// ===== 方法 =====
const toggleComment = () => {
  showComment.value = !showComment.value
}
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.comment-wrapper {
  margin: 0 30rpx 20rpx;
}

.detail-page {
  min-height: 100vh;
  background: #F5F6FA;
  padding-bottom: 120rpx;
}

.cover {
  width: 100%;
  height: 400rpx;
  display: block;
}

.header {
  background: #fff;
  padding: 30rpx 30rpx 24rpx;
  margin-top: -20rpx;
  border-radius: 20rpx 20rpx 0 0;
  position: relative;
  
  .title {
    font-size: 38rpx;
    font-weight: 700;
    color: $text-primary;
    display: block;
    line-height: 1.4;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: $text-secondary;
    display: block;
    margin-top: 12rpx;
  }
  
  .meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;
    
    .meta-tag {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      color: #fff;
      
      &.free {
        background: #1DD1A1;
      }
      
      &.pay {
        background: #FF6B6B;
      }
    }
    
    .meta-text {
      font-size: 24rpx;
      color: $text-hint;
    }
  }
}

.content-wrapper {
  background: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  position: relative;
  
  .preview {
    position: relative;
    
    .preview-content {
      font-size: 30rpx;
      line-height: 1.8;
      color: $text-primary;
      opacity: 0.7;
      
      :deep(h1), :deep(h2), :deep(h3) {
        margin: 16rpx 0;
      }
      
      :deep(p) {
        margin: 8rpx 0;
      }
    }
    
    .pay-overlay {
      position: absolute;
      bottom: 0;
      left: -30rpx;
      right: -30rpx;
      padding: 60rpx 30rpx 30rpx;
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.95) 40%);
      border-radius: 0 0 20rpx 20rpx;
      
      .pay-card {
        background: #fff;
        border-radius: 20rpx;
        padding: 40rpx 30rpx 30rpx;
        text-align: center;
        box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.10);
        border: 2rpx solid #F0F2F8;
        
        .pay-icon {
          font-size: 60rpx;
          display: block;
        }
        
        .pay-title {
          font-size: 34rpx;
          font-weight: 700;
          color: $text-primary;
          display: block;
          margin-top: 12rpx;
        }
        
        .pay-desc {
          font-size: 28rpx;
          color: $text-secondary;
          display: block;
          margin-top: 8rpx;
          
          &.small {
            font-size: 24rpx;
            color: $text-hint;
          }
        }
        
        .pay-actions {
          margin-top: 24rpx;
          
          .pay-btn {
            width: 100%;
            padding: 28rpx 0;
            background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
            color: #fff;
            font-size: 32rpx;
            font-weight: 600;
            border-radius: 60rpx;
            border: none;
            box-shadow: 0 8rpx 32rpx rgba(108, 92, 231, 0.3);
            
            &:active {
              opacity: 0.8;
              transform: scale(0.97);
            }
            
            &:disabled {
              opacity: 0.5;
            }
          }
          
          .pay-bottom {
            display: flex;
            justify-content: space-between;
            margin-top: 16rpx;
            
            .pay-points {
              font-size: 24rpx;
              color: $text-secondary;
            }
            
            .pay-tip {
              font-size: 24rpx;
              color: $primary;
              
              &:active {
                opacity: 0.7;
              }
            }
          }
        }
      }
    }
  }
  
  .full-content {
    font-size: 30rpx;
    line-height: 1.8;
    color: $text-primary;
    
    :deep(h1) {
      font-size: 40rpx;
      margin: 32rpx 0 16rpx;
    }
    
    :deep(h2) {
      font-size: 34rpx;
      margin: 28rpx 0 12rpx;
    }
    
    :deep(h3) {
      font-size: 30rpx;
      margin: 24rpx 0 8rpx;
    }
    
    :deep(p) {
      margin: 12rpx 0;
    }
    
    :deep(ul), :deep(ol) {
      padding-left: 32rpx;
      margin: 12rpx 0;
    }
    
    :deep(li) {
      margin: 6rpx 0;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  justify-content: space-between;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  
  .bar-left, .bar-right {
    display: flex;
    gap: 24rpx;
  }
  
  .bar-btn {
    font-size: 28rpx;
    color: $text-secondary;
    padding: 12rpx 20rpx;
    
    &:active {
      opacity: 0.6;
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 28rpx;
  color: $text-hint;
}
</style>