// admin/src/api/oss.js

// ============================================================
// 环境配置
// ============================================================
import config from '@/config'

const BASE_URL = config.baseURL

// ============================================================
// 获取 OSS 签名
// ============================================================
export const getOSSSignature = async (dir, ext) => {
  try {
    const response = await fetch(`${BASE_URL}/oss/signature?dir=${dir}&ext=${ext}`)
    const data = await response.json()
    
    if (data.code !== 0) {
      throw new Error(data.message || '获取签名失败')
    }
    
    return data.data
  } catch (err) {
    console.error('获取签名失败:', err)
    throw err
  }
}

// ============================================================
// 上传文件到 OSS
// ============================================================
export const uploadToOSS = async (file, dir = 'images/') => {
  try {
    // 获取文件扩展名
    const fileName = file.name || 'image.jpg'
    const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '.jpg'
    
    // 1. 获取签名
    const signatureData = await getOSSSignature(dir, ext)
    console.log('📝 签名数据:', signatureData)
    
    const { host, key, policy, signature, accessKeyId } = signatureData
    
    // 2. 构建 FormData
    const formData = new FormData()
    formData.append('key', key)
    formData.append('policy', policy)
    formData.append('OSSAccessKeyId', accessKeyId)
    formData.append('signature', signature)
    formData.append('success_action_status', '200')
    formData.append('file', file)
    
    // 3. 上传到 OSS
    const uploadRes = await fetch(host, {
      method: 'POST',
      body: formData
    })
    
    if (uploadRes.status === 200 || uploadRes.status === 204) {
      const url = `${host}/${key}`
      console.log('✅ OSS 上传成功:', url)
      return url
    } else {
      const text = await uploadRes.text()
      console.error('❌ 上传失败:', text)
      throw new Error(`上传失败 (${uploadRes.status})`)
    }
    
  } catch (err) {
    console.error('❌ OSS 上传错误:', err)
    throw err
  }
}

// ============================================================
// 上传文章封面
// ============================================================
export const uploadArticleCover = (file) => {
  return uploadToOSS(file, 'articles/')
}

// ============================================================
// 上传通用图片
// ============================================================
export const uploadImage = (file, dir = 'images/') => {
  return uploadToOSS(file, dir)
}