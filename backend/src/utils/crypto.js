const bcrypt = require('bcryptjs')

/**
 * 密码加密
 */
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

/**
 * 验证密码
 */
exports.verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * 生成订单号
 */
exports.generateOrderNo = () => {
  const now = new Date()
  const dateStr = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `ORD${dateStr}${random}${Date.now().toString().slice(-4)}`
}