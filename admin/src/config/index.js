// admin/src/config/index.js

// ============================================================
// 环境配置
// ============================================================

// 当前环境
const ENV = import.meta.env.MODE || 'development'

// API 配置
const API_CONFIG = {
  development: {
    baseURL: 'http://8.138.195.169:8080/api',
    timeout: 30000,
    debug: true
  },
  staging: {
    baseURL: 'http://8.138.195.169:8080/api',
    timeout: 30000,
    debug: true
  },
  production: {
    baseURL: 'http://8.138.195.169:8080/api',
    timeout: 30000,
    debug: false
  }
}

// 获取当前环境配置
const config = API_CONFIG[ENV] || API_CONFIG.development

console.log('当前环境:', ENV)
console.log('API 地址:', config.baseURL)

export default config