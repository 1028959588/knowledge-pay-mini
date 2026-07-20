<template>
  <view class="comment-section">
    <!-- ===== 评论输入 ===== -->
    <view class="comment-input-wrapper">
      <input 
        class="comment-input" 
        v-model="commentText" 
        placeholder="说点什么..." 
        maxlength="200"
        confirm-type="send"
        @confirm="submitComment"
      />
      <button class="comment-send" @tap="submitComment" :disabled="!commentText.trim() || submitting">
        {{ submitting ? '发送中' : '发送' }}
      </button>
    </view>

    <!-- ===== 评论列表 ===== -->
    <view class="comment-list">
      <view 
        class="comment-item" 
        v-for="item in comments" 
        :key="item.id"
      >
        <view class="comment-avatar">
          <text>{{ item.nickname?.charAt(0) || 'U' }}</text>
        </view>
        <view class="comment-body">
          <view class="comment-user">
            <text class="comment-name">{{ item.nickname || '用户' }}</text>
            <text class="comment-time">{{ formatTime(item.created_at) }}</text>
          </view>
          <text class="comment-content">{{ item.content }}</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && comments.length === 0" class="comment-empty">
        <text>暂无评论，来说点什么吧</text>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="loadingMore" class="comment-loading">
        <text>加载更多...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'  // ✅ ref 从 vue 导入
import { onLoad } from '@dcloudio/uni-app'  // ✅ onLoad 从 uni-app 导入

// ============================================================
// Props
// ============================================================
const props = defineProps({
  articleId: {
    type: Number,
    required: true
  }
})

// ============================================================
// 响应式数据
// ============================================================
const comments = ref([])
const commentText = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const page = ref(1)
const hasMore = ref(true)

// ============================================================
// 加载评论
// ============================================================
const loadComments = async (isLoadMore = false) => {
  if (loading.value || loadingMore.value) return
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    comments.value = []
  }
  
  try {
    // TODO: 调用评论API
    // const res = await commentAPI.list(props.articleId, { page: page.value, limit: 20 })
    // comments.value = isLoadMore ? [...comments.value, ...res.data.list] : res.data.list
    // hasMore.value = res.data.list.length >= 20
    
    // 模拟数据
    setTimeout(() => {
      if (!isLoadMore) {
        comments.value = [
          { id: 1, nickname: '用户_1234', content: '这篇文章写得太好了！', created_at: new Date().toISOString() },
          { id: 2, nickname: '微信用户', content: '学到了很多知识，感谢分享', created_at: new Date(Date.now() - 60000).toISOString() },
        ]
      }
      loading.value = false
      loadingMore.value = false
    }, 500)
    
  } catch (err) {
    console.error('加载评论失败:', err)
    loading.value = false
    loadingMore.value = false
  }
}

// ============================================================
// 提交评论
// ============================================================
const submitComment = async () => {
  if (!commentText.value.trim() || submitting.value) return
  
  submitting.value = true
  
  try {
    // TODO: 调用评论API
    // await commentAPI.create(props.articleId, commentText.value.trim())
    
    // 模拟提交
    comments.value.unshift({
      id: Date.now(),
      nickname: '我',
      content: commentText.value.trim(),
      created_at: new Date().toISOString()
    })
    
    commentText.value = ''
    uni.showToast({ title: '评论成功', icon: 'success' })
    
  } catch (err) {
    console.error('提交评论失败:', err)
    uni.showToast({ title: err.message || '评论失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ============================================================
// 工具函数
// ============================================================
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth()+1}月${date.getDate()}日 ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// ============================================================
// 生命周期
// ============================================================
onLoad(() => {
  loadComments()
})
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$text-primary: #2D3436;
$text-secondary: #636E72;
$text-hint: #B2BEC3;

.comment-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-top: 20rpx;
}

// ===== 评论输入 =====
.comment-input-wrapper {
  display: flex;
  gap: 12rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #F0F2F8;
  
  .comment-input {
    flex: 1;
    height: 72rpx;
    background: #F5F6FA;
    border-radius: 36rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: $text-primary;
  }
  
  .comment-send {
    width: 120rpx;
    height: 72rpx;
    background: $primary;
    color: #fff;
    font-size: 26rpx;
    border-radius: 36rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:disabled {
      opacity: 0.5;
    }
    
    &:active {
      opacity: 0.8;
    }
  }
}

// ===== 评论列表 =====
.comment-list {
  padding-top: 16rpx;
  
  .comment-item {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #F5F6FA;
    
    .comment-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: $primary;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      flex-shrink: 0;
    }
    
    .comment-body {
      flex: 1;
      
      .comment-user {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .comment-name {
          font-size: 26rpx;
          font-weight: 600;
          color: $text-primary;
        }
        
        .comment-time {
          font-size: 22rpx;
          color: $text-hint;
        }
      }
      
      .comment-content {
        font-size: 28rpx;
        color: $text-secondary;
        display: block;
        margin-top: 6rpx;
        line-height: 1.5;
      }
    }
  }
  
  .comment-empty {
    text-align: center;
    padding: 40rpx 0;
    color: $text-hint;
    font-size: 26rpx;
  }
  
  .comment-loading {
    text-align: center;
    padding: 20rpx 0;
    color: $text-hint;
    font-size: 24rpx;
  }
}
</style>