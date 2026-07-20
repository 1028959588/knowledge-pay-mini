// admin/src/api/import.js

import config from '@/config'

const BASE_URL = config.baseURL

// ============================================================
// 请求封装
// ============================================================
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('admin_token') || ''
    
    fetch(BASE_URL + options.url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: options.data ? JSON.stringify(options.data) : undefined
    })
    .then(res => res.json())
    .then(data => {
      if (data.code === 0) {
        resolve(data)
      } else {
        reject(data)
      }
    })
    .catch(reject)
  })
}

// ============================================================
// 导入 API
// ============================================================
export const importAPI = {
  // 批量导入（CSV/Excel）
  batch: (articles) => {
    return request({
      url: '/import/batch',
      method: 'POST',
      data: { articles }
    })
  },
  
  // RSS 预览
  rssPreview: (url) => {
    return request({
      url: '/import/rss/preview',
      method: 'POST',
      data: { url }
    })
  },
  
  // RSS 导入（选中文章）
  rssImport: (items, category_id, type, autoPublish) => {
    return request({
      url: '/import/rss/import',
      method: 'POST',
      data: { items, category_id, type, autoPublish }
    })
  },
  
  // 公众号预览（只抓取不导入）
  wechatPreview: (urls) => {
    return request({
      url: '/import/wechat/preview',
      method: 'POST',
      data: { urls }
    })
  },
  
  // 公众号导入（传入选中的文章）
  wechatImport: (items, category_id, type, autoPublish) => {
    return request({
      url: '/import/wechat/import',
      method: 'POST',
      data: { items, category_id, type, autoPublish }
    })
  }
}