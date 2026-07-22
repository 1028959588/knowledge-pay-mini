<template>
  <view class="agreement-page">
    <view class="agreement-content" v-html="renderedContent"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { settingsAPI } from '@/utils/api.js'

const rawContent = ref('')
const isLoggedIn = ref(false)
const titleMap = {
  user: '用户协议',
  privacy: '隐私政策'
}

onLoad((options) => {
  const type = options.type || 'user'
  
  uni.setNavigationBarTitle({ title: titleMap[type] || '协议' })
  
  // 检查登录状态
  checkLoginStatus()
  
  loadAgreement(type)
})

// 页面返回事件 - 使用 uni-app 的 onBackPress
uni.onBackPress = (options) => {
  console.log('返回按钮点击', options)
  handleBack()
  return true
}

// 检查登录状态
const checkLoginStatus = () => {
  const token = uni.getStorageSync('token')
  const userInfo = uni.getStorageSync('userInfo')
  isLoggedIn.value = !!(token && userInfo)
  console.log('登录状态:', isLoggedIn.value)
}

// 处理返回逻辑
const handleBack = () => {
  console.log('执行返回逻辑，登录状态:', isLoggedIn.value)
  
  if (isLoggedIn.value) {
    // 已登录：返回上一页
    uni.navigateBack({
      fail: (err) => {
        console.log('返回失败:', err)
        // 如果没有上一页，跳转到首页
        uni.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  } else {
    // 未登录：跳转到登录页
    console.log('跳转到登录页')
    uni.redirectTo({
      url: '/pages/login/login',
      fail: (err) => {
        console.log('跳转登录页失败:', err)
        // 如果 redirectTo 失败，尝试 navigateTo
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }
    })
  }
}

const loadAgreement = async (type) => {
  try {
    const res = await settingsAPI.getAgreement(type)
    console.log('API响应:', res)
    
    // 检查响应状态 - 修正判断逻辑
    if (res && res.code === 0) {
      // 成功获取数据
      rawContent.value = res.data || '<p style="text-align:center;color:#999;">内容加载中...</p>'
      console.log('内容加载成功，长度:', rawContent.value.length)
    } else if (res && res.code === 401) {
      // 未登录，跳转到登录页面
      console.log('未登录，跳转到登录页')
      handleUnauthorized()
    } else {
      // 其他错误
      throw new Error(res?.message || '加载失败')
    }
  } catch (err) {
    console.error('加载协议失败:', err)
    
    // 判断是否是登录相关错误
    if (err.message?.includes('登录') || err.message?.includes('token') || err.message?.includes('认证')) {
      handleUnauthorized()
    } else {
      rawContent.value = '<p style="text-align:center;color:#999;">内容加载失败，请稍后重试</p>'
    }
  }
}

// 处理未授权跳转
const handleUnauthorized = () => {
  // 清除本地存储的登录信息
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  isLoggedIn.value = false
  
  // 跳转到登录页面
  uni.redirectTo({
    url: '/pages/login/login'
  })
}

// 处理内容，保留后台样式并确保换行正常
const renderedContent = computed(() => {
  if (!rawContent.value) return ''
  
  let content = rawContent.value
  
  // 如果内容包含 HTML 标签，说明是富文本，不需要额外处理换行
  // 如果内容不包含 HTML 标签，则将 \n 转换为 <br>
  if (!/<[^>]+>/.test(content)) {
    // 1. 将 \n 转换为 <br>
    content = content.replace(/\n/g, '<br>')
    
    // 2. 将连续的 <br> 标签合并，避免过多空白
    content = content.replace(/(<br>\s*){3,}/g, '<br><br>')
    
    // 3. 处理后台可能返回的 \r\n
    content = content.replace(/\r\n/g, '<br>')
    content = content.replace(/\r/g, '<br>')
  }
  
  return content
})
</script>

<style lang="scss" scoped>
.agreement-page {
  min-height: 100vh;
  padding: 0rpx;
  background: #F5F6FA;
}

.agreement-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 40rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: #2D3436;
  word-wrap: break-word;
  overflow: hidden;
  
  // 完全保留后台样式，仅做基础兜底
  * {
    max-width: 100%;
    box-sizing: border-box;
  }
  
  // 标题样式
  h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    margin: 0.5em 0 0.3em;
  }
  
  h1 { font-size: 36rpx; text-align: center; }
  h2 { font-size: 32rpx; }
  h3 { font-size: 30rpx; }
  
  // 段落
  p {
    margin: 0.3em 0;
    // 保留后台可能设置的样式
    &[style] {
      all: unset;
      display: block;
      margin: 0.3em 0;
    }
  }
  
  // 列表
  ul, ol {
    padding-left: 40rpx;
    margin: 0.3em 0;
  }
  
  li {
    margin: 0.1em 0;
  }
  
  // 图片
  img {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0.5em auto;
  }
  
  // 表格
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    
    td, th {
      border: 1px solid #ddd;
      padding: 8rpx 12rpx;
    }
  }
  
  // 引用
  blockquote {
    border-left: 6rpx solid #007AFF;
    padding-left: 20rpx;
    margin: 0.3em 0;
    color: #666;
  }
  
  // 链接
  a {
    color: #007AFF;
    text-decoration: underline;
  }
  
  // 保留后台内联样式
  [style] {
    // 不覆盖任何后台样式，让后台样式生效
  }
  
  // 强制保留换行
  br {
    display: block;
    content: '';
    margin: 0;
  }
  
  // 防止内容溢出
  pre, code {
    white-space: pre-wrap;
    word-break: break-all;
  }
  
  // 空白处理
  .agreement-content {
    white-space: pre-wrap; // 保留空白和换行
  }
}
</style>