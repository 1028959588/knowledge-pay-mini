// admin/src/api/index.js

import config from '@/config'

const BASE_URL = config.baseURL

// ============================================================
// 请求封装
// ============================================================
const getToken = () => {
  return localStorage.getItem('admin_token') || ''
}

export const request = (options) => {
  return new Promise((resolve, reject) => {
    fetch(BASE_URL + options.url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: options.data ? JSON.stringify(options.data) : undefined
    })
    .then(res => res.json())
    .then(data => {
      console.log('📡 API 响应:', options.url, data)
      if (data.code === 0) {
        resolve(data.data)
      } else if (data.code === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/login'
        reject(data)
      } else {
        reject(data)
      }
    })
    .catch((err) => {
      console.error('❌ API 请求失败:', err)
      reject(err)
    })
  })
}

// ============================================================
// 导入扩展模块
// ============================================================
import { importAPI } from './import'

// ============================================================
// API 模块（按功能分组）
// ============================================================

// ----- 认证模块 -----
export const authAPI = {
  login: (username, password) => {
    return request({
      url: '/auth/login',
      method: 'POST',
      data: { phone: username, password }
    })
  }
}

// ----- 用户模块 -----
export const userAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString()
    return request({ url: `/admin/users?${query}` })
  },
  detail: (id) => {
    return request({ url: `/admin/users/${id}` })
  },
  updateStatus: (id, status) => {
    return request({
      url: `/admin/users/${id}/status`,
      method: 'PUT',
      data: { status }
    })
  },
  updatePoints: (id, amount, reason) => {
    return request({
      url: `/admin/users/${id}/points`,
      method: 'PUT',
      data: { amount, reason }
    })
  }
}

// ----- 分类模块 -----
export const categoryAPI = {
  list: () => {
    return request({ url: '/admin/categories' })
  },
  create: (data) => {
    return request({
      url: '/admin/categories',
      method: 'POST',
      data
    })
  },
  update: (id, data) => {
    return request({
      url: `/admin/categories/${id}`,
      method: 'PUT',
      data
    })
  },
  delete: (id) => {
    return request({
      url: `/admin/categories/${id}`,
      method: 'DELETE'
    })
  }
}

// ----- 文章模块 -----
export const articleAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString()
    return request({ url: `/admin/articles?${query}` })
  },
  detail: (id) => {
    return request({ url: `/admin/articles/${id}` })
  },
  create: (data) => {
    return request({
      url: '/admin/articles',
      method: 'POST',
      data
    })
  },
  update: (id, data) => {
    return request({
      url: `/admin/articles/${id}`,
      method: 'PUT',
      data
    })
  },
  delete: (id) => {
    return request({
      url: `/admin/articles/${id}`,
      method: 'DELETE'
    })
  },
  updateStatus: (id, status) => {
    return request({
      url: `/admin/articles/${id}/status`,
      method: 'PUT',
      data: { status }
    })
  },
  updateTop: (id, is_top) => {
    return request({
      url: `/admin/articles/${id}/top`,
      method: 'PUT',
      data: { is_top }
    })
  }
}

// ----- 订单模块 -----
export const orderAPI = {
  rechargeList: (params) => {
    const query = new URLSearchParams(params).toString()
    return request({ url: `/admin/orders/recharge?${query}` })
  },
  payList: (params) => {
    const query = new URLSearchParams(params).toString()
    return request({ url: `/admin/orders/pay?${query}` })
  }
}

// ----- 仪表盘模块 -----
export const dashboardAPI = {
  getStats: () => {
    return request({ url: '/admin/dashboard' })
  }
}

// ----- 系统设置模块 -----
export const settingsAPI = {
  get: () => {
    return request({ url: '/admin/settings' })
  },
  update: (data) => {
    return request({
      url: '/admin/settings',
      method: 'PUT',
      data
    })
  },
  stats: () => {
    return request({ url: '/admin/settings/stats' })
  },
  
  // 获取协议
  getAgreement: (type) => {
    return request({
      url: `/settings/agreement?type=${type}`
    })
  },

  // 更新协议
  updateAgreement: (type, content) => {
    return request({
      url: '/settings/agreement',
      method: 'PUT',
      data: { type, content }
    })
  }
}

// ----- Banner 模块 -----
export const bannerAPI = {
  list: () => {
    return request({ url: '/admin/settings/banners' })
  },
  create: (data) => {
    return request({
      url: '/admin/settings/banners',
      method: 'POST',
      data
    })
  },
  update: (id, data) => {
    return request({
      url: `/admin/settings/banners/${id}`,
      method: 'PUT',
      data
    })
  },
  delete: (id) => {
    return request({
      url: `/admin/settings/banners/${id}`,
      method: 'DELETE'
    })
  }
}

// ----- 批量导入模块 -----
export { importAPI }

// ============================================================
// 统一默认导出
// ============================================================
export default {
  authAPI,
  userAPI,
  categoryAPI,
  articleAPI,
  orderAPI,
  dashboardAPI,
  settingsAPI,
  bannerAPI,
  importAPI
}