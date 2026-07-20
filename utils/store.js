// utils/store.js

// ============================================================
// 用户状态管理（全局）
// ============================================================

/**
 * 获取当前登录状态
 */
export const getLoginStatus = () => {
  const token = uni.getStorageSync('token')
  const userInfo = uni.getStorageSync('userInfo')
  const loginTime = uni.getStorageSync('loginTime')
  
  // 检查 token 是否存在
  if (!token) return false
  
  // 检查 token 是否过期（7天）
  if (loginTime) {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (now - loginTime > sevenDays) {
      // token 过期，清除登录状态
      clearLoginState()
      return false
    }
  }
  
  return !!userInfo
}

/**
 * 保存登录状态
 */
export const setLoginState = (token, userInfo) => {
  try {
    uni.setStorageSync('token', token)
    uni.setStorageSync('userInfo', {
      id: userInfo.id,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      phone: userInfo.phone || '',
      email: userInfo.email || '',
      points: userInfo.points || 0,
      hasPassword: userInfo.hasPassword || false
    })
    uni.setStorageSync('loginTime', Date.now())
    uni.setStorageSync('isLogin', true)
    console.log('✅ 登录状态已保存')
  } catch (err) {
    console.error('保存登录状态失败:', err)
  }
}

/**
 * 清除登录状态（退出登录）
 */
export const clearLoginState = () => {
  try {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('loginTime')
    uni.removeStorageSync('isLogin')
    console.log('✅ 登录状态已清除')
  } catch (err) {
    console.error('清除登录状态失败:', err)
  }
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (userInfo) => {
  try {
    uni.setStorageSync('userInfo', userInfo)
    console.log('✅ 用户信息已更新')
  } catch (err) {
    console.error('更新用户信息失败:', err)
  }
}

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  try {
    return uni.getStorageSync('userInfo') || null
  } catch (err) {
    return null
  }
}

/**
 * 获取 Token
 */
export const getToken = () => {
  try {
    return uni.getStorageSync('token') || null
  } catch (err) {
    return null
  }
}