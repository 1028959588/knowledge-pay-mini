require('dotenv').config()

module.exports = {
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || 'knowledge_pay_2024_secret',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'knowledge_pay'
  },
  wechat: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || ''
  }
}
