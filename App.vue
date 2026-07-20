<script>
import { getLoginStatus } from '@/utils/store.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 检查登录状态
    const isLogin = getLoginStatus()
    console.log('登录状态:', isLogin)
    
    // 如果已登录，但当前在登录页，跳转到首页
    if (isLogin) {
      const pages = getCurrentPages()
      if (pages.length === 0 || pages[0].route === 'pages/login/login') {
        // 延迟跳转，确保页面加载完成
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 300)
      }
    }
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局样式 */
</style>