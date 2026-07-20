const express = require('express')
const crypto = require('crypto')
const router = express.Router()

// ============================================================
// OSS 签名接口
// ============================================================
router.get('/signature', async (req, res) => {
  try {
    const { dir = 'images/', ext = '.jpg' } = req.query
    
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
    const bucket = process.env.OSS_BUCKET
    const region = process.env.OSS_REGION || 'oss-cn-guangzhou'
    
    // ============================================================
    // 调试日志
    // ============================================================
    console.log('=== OSS 签名请求 ===')
    console.log('dir:', dir)
    console.log('ext:', ext)
    console.log('bucket:', bucket)
    console.log('region:', region)
    console.log('accessKeyId:', accessKeyId)
    console.log('accessKeySecret:', accessKeySecret ? '已配置' : '未配置')
    
    if (!accessKeyId || !accessKeySecret || !bucket) {
      console.error('❌ OSS 配置不完整')
      return res.status(500).json({
        code: 1,
        message: 'OSS 配置不完整，请检查环境变量'
      })
    }
    
    const dirPath = dir.endsWith('/') ? dir : `${dir}/`
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    const filename = `${timestamp}_${random}${ext}`
    const objectKey = `${dirPath}${filename}`
    const host = `https://${bucket}.${region}.aliyuncs.com`
    
    // ============================================================
    // 构建 Policy（OSS 官方格式）
    // ============================================================
    const expiration = new Date(Date.now() + 3600000).toISOString()
    const policy = {
      expiration: expiration,
      conditions: [
        ['content-length-range', 0, 5 * 1024 * 1024]
      ]
    }
    
    // ============================================================
    // 生成 Policy Base64
    // ============================================================
    const policyString = JSON.stringify(policy)
    const policyBase64 = Buffer.from(policyString).toString('base64')
    
    // ============================================================
    // 生成签名（官方方式）
    // ============================================================
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(policyBase64)
      .digest('base64')
    
    // ============================================================
    // 调试输出
    // ============================================================
    console.log('📝 Policy String:', policyString)
    console.log('📝 Policy Base64:', policyBase64)
    console.log('📝 Signature:', signature)
    console.log('📝 Host:', host)
    console.log('📝 Key:', objectKey)
    
    res.json({
      code: 0,
      data: {
        host: host,
        accessKeyId: accessKeyId,
        policy: policyBase64,
        signature: signature,
        key: objectKey,
        url: `${host}/${objectKey}`,
        dir: dirPath,
        filename: filename
      }
    })
    
  } catch (error) {
    console.error('❌ OSS 签名失败:', error)
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
})

module.exports = router