// admin/src/api/zhihu.js

import config from '@/config'

const BASE_URL = config.baseURL

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

export const zhihuAPI = {
  fetch: (urls, category_id, type, autoPublish) => {
    return request({
      url: '/crawler/zhihu-feedloom/fetch',
      method: 'POST',
      data: { urls, category_id, type, autoPublish }
    })
  },
  
  preview: (url) => {
    return request({
      url: '/crawler/zhihu-feedloom/preview',
      method: 'POST',
      data: { url }
    })
  }
}