const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * 用户身份验证中间件
 */
module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录' })
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' })
  }
}

/**
 * 管理员权限验证中间件（在 auth 之后使用）
 */
module.exports.isAdmin = function(req, res, next) {
  // TODO: 添加管理员角色验证
  // 暂时所有登录用户都视为管理员
  next()
}