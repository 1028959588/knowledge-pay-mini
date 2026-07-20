// backend/src/utils/email.js

const nodemailer = require('nodemailer')

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.qq.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

/**
 * 发送验证码邮件
 */
exports.sendVerificationCode = async (to, code, type = 'login') => {
  const typeMap = {
    register: '注册',
    login: '登录',
    reset: '重置密码',
    'set-password': '设置密码'
  }
  
  const typeName = typeMap[type] || '登录'
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '知识付费系统 <noreply@knowledge-pay.com>',
    to: to,
    subject: '📧 知识付费 - 验证码',
    html: `
      <div style="max-width:500px;margin:0 auto;padding:40px 30px;font-family:Arial,sans-serif;">
        <div style="text-align:center;margin-bottom:30px;">
          <div style="font-size:48px;">📚</div>
          <h2 style="color:#2D3436;">知识付费</h2>
          <p style="color:#909399;">让知识更有价值</p>
        </div>
        <div style="background:#F0EDFF;border-radius:12px;padding:30px;text-align:center;">
          <p style="color:#636E72;margin-bottom:12px;">您的 ${typeName} 验证码是</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6C5CE7;">${code}</div>
        </div>
        <p style="text-align:center;color:#B2BEC3;font-size:13px;margin-top:20px;">
          验证码 5 分钟内有效，请勿告知他人
        </p>
        <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #F0F2F8;font-size:12px;color:#B2BEC3;">
          © ${new Date().getFullYear()} 知识付费 · 系统自动发送
        </div>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ 验证码邮件发送成功:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ 邮件发送失败:', error)
    throw error
  }
}