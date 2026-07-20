// utils/upload.js

// ============================================================
// 环境配置
// ============================================================

const ENV = 'production'

const API_CONFIG = {
  development: 'http://localhost:8080/api',
  production: 'http://8.138.195.169:8080/api'
}

const BASE_URL = API_CONFIG[ENV]

// ============================================================
// 请求封装
// ============================================================
const request = (options) => {
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
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// ============================================================
// 上传图片到 OSS
// ============================================================
export const uploadToOSS = (options) => {
  const { filePath, dir = 'images/', ext = '.jpg', onProgress } = options
  
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📤 开始上传:', filePath)
      
      // 1. 获取上传签名
      const signRes = await request({
        url: `/oss/signature?dir=${dir}&ext=${ext}`
      })
      
      console.log('📝 签名响应:', signRes)
      
      if (signRes.code !== 0) {
        throw new Error(signRes.message || '获取签名失败')
      }
      
      const { host, key, policy, signature, accessKeyId } = signRes.data
      
      console.log('🌐 上传地址:', host)
      console.log('📄 文件路径:', key)
      
      // 2. 上传文件到 OSS
      const uploadTask = uni.uploadFile({
        url: host,
        filePath: filePath,
        name: 'file',
        formData: {
          key: key,
          policy: policy,
          OSSAccessKeyId: accessKeyId,
          signature: signature,
          success_action_status: '200'
        },
        success: (res) => {
          console.log('📥 上传响应:', res)
          if (res.statusCode === 200) {
            const fileUrl = `${host}/${key}`
            console.log('✅ 上传成功:', fileUrl)
            resolve({
              url: fileUrl,
              key: key,
              host: host
            })
          } else {
            reject(new Error(`上传失败 (${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('❌ 上传失败:', err)
          reject(err)
        }
      })
      
      // 监听上传进度
      if (onProgress) {
        uploadTask.onProgressUpdate((res) => {
          onProgress(res.progress)
        })
      }
      
    } catch (err) {
      console.error('❌ 上传流程失败:', err)
      reject(err)
    }
  })
}

// ============================================================
// 快捷上传方法
// ============================================================

// 上传用户头像
export const uploadAvatar = (filePath, onProgress) => {
  return uploadToOSS({
    filePath,
    dir: 'avatars/',
    ext: '.jpg',
    onProgress
  })
}

// 上传文章封面
export const uploadArticleCover = (filePath, onProgress) => {
  return uploadToOSS({
    filePath,
    dir: 'articles/',
    ext: '.jpg',
    onProgress
  })
}

// 上传评论图片
export const uploadCommentImage = (filePath, onProgress) => {
  return uploadToOSS({
    filePath,
    dir: 'comments/',
    ext: '.jpg',
    onProgress
  })
}

// 通用上传
export const uploadImage = (filePath, dir = 'images/', onProgress) => {
  return uploadToOSS({
    filePath,
    dir,
    ext: '.jpg',
    onProgress
  })
}