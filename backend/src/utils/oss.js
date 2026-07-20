// backend/src/utils/oss.js

const crypto = require('crypto')
const axios = require('axios')
const FormData = require('form-data')

// ============================================================
// 上传文件到 OSS（支持 Buffer）
// ============================================================
async function uploadToOSS(data, key, contentType = 'image/jpeg') {
  try {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
    const bucket = process.env.OSS_BUCKET
    const region = process.env.OSS_REGION || 'oss-cn-guangzhou'
    
    if (!accessKeyId || !accessKeySecret || !bucket) {
      console.warn('⚠️ OSS 未配置，返回原链接')
      return data
    }
    
    const host = `https://${bucket}.${region}.aliyuncs.com`
    const date = new Date().toUTCString()
    const url = `${host}/${key}`
    
    // 如果 data 是字符串，转为 Buffer
    let buffer = data
    if (typeof data === 'string') {
      buffer = Buffer.from(data)
    }
    
    // 生成签名
    const method = 'PUT'
    const stringToSign = `${method}\n\n${contentType}\n${date}\n/${bucket}/${key}`
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(stringToSign)
      .digest('base64')
    
    const response = await axios({
      method: 'PUT',
      url: url,
      data: buffer,
      headers: {
        'Content-Type': contentType,
        'Date': date,
        'Authorization': `OSS ${accessKeyId}:${signature}`,
        'Content-Length': buffer.length
      },
      timeout: 30000
    })
    
    if (response.status === 200) {
      console.log(`✅ OSS 上传成功: ${key}`)
      return `${host}/${key}`
    } else {
      throw new Error(`上传失败: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ OSS 上传失败:', error.message)
    throw error
  }
}

// ============================================================
// 下载并上传图片到 OSS
// ============================================================
async function downloadAndUploadImage(imageUrl) {
  try {
    // 如果已经是 OSS 链接，直接返回
    if (imageUrl.includes('knowledge-pay-img.oss-cn-guangzhou.aliyuncs.com')) {
      return imageUrl
    }
    
    // 如果图片是 data:image 格式
    if (imageUrl.startsWith('data:image')) {
      const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')
        const contentType = `image/${ext}`
        const key = `articles/images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        return await uploadToOSS(buffer, key, contentType)
      }
    }
    
    console.log(`📸 下载图片: ${imageUrl.substring(0, 60)}...`)
    
    // 下载图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mp.weixin.qq.com/'
      }
    })
    
    // 获取 Content-Type
    let contentType = response.headers['content-type'] || 'image/jpeg'
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg'
    
    // 生成文件名
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    const key = `articles/images/wechat_${timestamp}_${random}.${ext}`
    
    // 上传到 OSS
    const ossUrl = await uploadToOSS(response.data, key, contentType)
    console.log(`✅ 图片上传成功: ${ossUrl.substring(0, 60)}...`)
    
    return ossUrl
    
  } catch (error) {
    console.error('❌ 处理图片失败:', error.message)
    return imageUrl
  }
}

// ============================================================
// 批量处理文章内容中的图片
// ============================================================
async function processArticleImages(content) {
  if (!content) return content
  
  // 提取所有图片链接
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi
  const matches = [...content.matchAll(imgRegex)]
  
  if (matches.length === 0) {
    console.log('📸 文章中没有图片')
    return content
  }
  
  console.log(`📸 发现 ${matches.length} 张图片，开始处理...`)
  
  let processedContent = content
  let successCount = 0
  
  for (const match of matches) {
    const originalSrc = match[1]
    if (!originalSrc) continue
    
    // 跳过已经是 OSS 的图片
    if (originalSrc.includes('knowledge-pay-img.oss-cn-guangzhou.aliyuncs.com')) {
      continue
    }
    
    try {
      const newUrl = await downloadAndUploadImage(originalSrc)
      // 替换图片链接
      processedContent = processedContent.replace(new RegExp(originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl)
      successCount++
      console.log(`✅ 已处理图片 (${successCount}/${matches.length})`)
    } catch (err) {
      console.error(`❌ 处理图片失败: ${originalSrc.substring(0, 50)}...`)
    }
  }
  
  console.log(`📊 图片处理完成: 成功 ${successCount} 张`)
  
  return processedContent
}

module.exports = {
  uploadToOSS,
  downloadAndUploadImage,
  processArticleImages
}