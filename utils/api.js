// utils/api.js

// ============================================================
// 环境配置
// ============================================================

// 🔧 开发环境（本地测试）
const BASE_URL = 'http://192.168.1.42:8080/api'

// 🚀 生产环境（服务器部署）
// const BASE_URL = 'http://8.138.195.169:8080/api'

// 🌐 正式域名（备案通过后使用）
// const BASE_URL = 'https://api.wxtool.vip/api'

console.log('🌐 API地址:', BASE_URL)

// ============================================================
// 请求封装
// ============================================================
export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token') || ''
    
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      timeout: 30000,
      success: (res) => {
        console.log('📥 请求响应:', options.url, res.statusCode, res.data)
        
        // ✅ 处理所有 HTTP 状态码
        if (res.statusCode === 200) {
          // ✅ 业务成功
          if (res.data.code === 0) {
            resolve(res.data)
          } else {
            // ✅ 业务失败（code !== 0）
            console.error('❌ 业务失败:', res.data.code, res.data.message)
            reject({
              code: res.data.code || 1,
              message: res.data.message || '请求失败'
            })
          }
        } else if (res.statusCode === 400) {
          // ✅ 处理 400 错误（密码错误、用户不存在等）
          console.error('❌ 请求参数错误:', res.data)
          reject({
            code: res.data.code || 1,
            message: res.data.message || '请求参数错误'
          })
        } else if (res.statusCode === 401) {
          // Token 过期
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.showToast({ title: '请重新登录', icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/login' })
          }, 1500)
          reject({
            code: 401,
            message: '登录已过期，请重新登录'
          })
        } else if (res.statusCode === 403) {
          reject({
            code: 403,
            message: res.data?.message || '权限不足'
          })
        } else if (res.statusCode === 404) {
          reject({
            code: 404,
            message: res.data?.message || '接口不存在'
          })
        } else if (res.statusCode === 500) {
          reject({
            code: 500,
            message: res.data?.message || '服务器错误，请稍后重试'
          })
        } else {
          // 其他状态码
          reject({
            code: res.statusCode,
            message: res.data?.message || '请求失败，请重试'
          })
        }
      },
      fail: (err) => {
        console.error('❌ 网络请求失败:', err)
        uni.showToast({ title: '网络异常，请检查网络', icon: 'none' })
        reject({
          code: -1,
          message: '网络异常，请检查网络连接'
        })
      }
    })
  })
}
// ============================================================
// 用户 API
// ============================================================
export const authAPI = {
  // 发送验证码
  sendCode: (phone) => {
    return request({
      url: '/auth/send-code',
      method: 'POST',
      data: { phone }
    })
  },
  // 注册
  register: (phone, code, password) => {
    return request({
      url: '/auth/register',
      method: 'POST',
      data: { phone, code, password }
    })
  },
  // 密码登录
  login: (phone, password) => {
	console.log('🔴 authAPI.login 被调用，手机号:', phone, '密码:', password)
    return request({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password }
    })
  },
  // 验证码登录
  loginByCode: (phone, code) => {
    return request({
      url: '/auth/login-by-code',
      method: 'POST',
      data: { phone, code }
    })
  },
  // 微信登录
  wxLogin: (code, userInfo) => {
    return request({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code, ...userInfo }
    })
  },
    // 发送邮箱验证码
    sendEmailCode: (email, type = 'login') => {
      return request({
        url: '/email/send-code',
        method: 'POST',
        data: { email, type }
      })
    },
    
    // 邮箱验证码登录
    emailLogin: (email, code) => {
      return request({
        url: '/email/login',
        method: 'POST',
        data: { email, code }
      })
    },
    
    // 邮箱密码登录
    emailPasswordLogin: (email, password) => {
      return request({
        url: '/email/password-login',
        method: 'POST',
        data: { email, password }
      })
    },
    
    // 设置密码
    setEmailPassword: (email, code, password) => {
      return request({
        url: '/email/set-password',
        method: 'POST',
        data: { email, code, password }
      })
    }
}

// ============================================================
// 用户信息 API
// ============================================================
export const userAPI = {
  profile: () => {
    return request({ url: '/user/profile' })
  },
  update: (data) => {
    return request({
      url: '/user/profile',
      method: 'PUT',
      data
    })
  },
  sendCode: (phone) => {
    return request({
      url: '/auth/send-code',
      method: 'POST',
      data: { phone }
    })
  },
  bindPhone: (phone, code) => {
    return request({
      url: '/user/bind-phone',
      method: 'POST',
      data: { phone, code }
    })
  },
  changePassword: (oldPassword, newPassword) => {
    return request({
      url: '/user/change-password',
      method: 'POST',
      data: { oldPassword, newPassword }
    })
  }
}

// ============================================================
// 签到 API
// ============================================================
export const checkinAPI = {
  today: () => {
    return request({ url: '/checkin/today' })
  },
  do: () => {
    return request({ url: '/checkin/do', method: 'POST' })
  },
  calendar: (year, month) => {
    return request({ url: `/checkin/calendar?year=${year}&month=${month}` })
  },
  replenish: (date) => {
    return request({
      url: '/checkin/replenish',
      method: 'POST',
      data: { date }
    })
  }
}

// ============================================================
// 积分 API
// ============================================================
export const pointsAPI = {
  balance: () => {
    return request({ url: '/points/balance' })
  },
  records: (params) => {
    return request({ url: '/points/records', data: params })
  },
  createRecharge: (amount) => {
    return request({
      url: '/recharge/create',
      method: 'POST',
      data: { amount }
    })
  },
  payRecharge: (orderId) => {
    return request({
      url: '/recharge/pay',
      method: 'POST',
      data: { orderId }
    })
  },
  rechargeRecords: (params) => {
    return request({ url: '/recharge/records', data: params })
  }
}

// ============================================================
// 文章 API
// ============================================================
export const articleAPI = {
  categories: () => {
    return request({ url: '/articles/categories' })
  },
  list: (params) => {
    return request({ url: '/articles', data: params })
  },
  detail: (id) => {
    return request({ url: `/articles/${id}` })
  },
  unlock: (id) => {
    return request({
      url: `/articles/${id}/unlock`,
      method: 'POST'
    })
  },
  checkUnlock: (id) => {
    return request({ url: `/articles/${id}/check` })
  },
  batchDetail: (ids) => {
    const promises = ids.map(id => 
      request({ url: `/articles/${id}` })
    )
    return Promise.allSettled(promises)
  }
}