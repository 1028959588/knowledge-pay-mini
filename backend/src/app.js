const express = require('express')
const cors = require('cors')
const path = require('path')  // ✅ 添加 path 模块
const { sequelize } = require('./models')
const config = require('./config')

const app = express()

// ============================================================
// 中间件
// ============================================================

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`)
  next()
})

// ============================================================
// 健康检查
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})


// ============================================================
// API 路由
// ============================================================

// 添加邮箱验证路由
const emailRoutes = require('./api/email')
app.use('/api/email', emailRoutes)

// 用户模块
const authRoutes = require('./api/auth')
app.use('/api/auth', authRoutes)

// 用户信息
const userRoutes = require('./api/user')
app.use('/api/user', userRoutes)

// 签到模块
const checkinRoutes = require('./api/checkin')
app.use('/api/checkin', checkinRoutes)

// 积分/充值
const pointsRoutes = require('./api/points')
app.use('/api', pointsRoutes)

// 文章模块
const articleRoutes = require('./api/article')
app.use('/api/articles', articleRoutes)

// 管理后台
const adminRoutes = require('./api/admin')
app.use('/api/admin', adminRoutes)

// ✅ OSS 上传签名（新增）
const ossRoutes = require('./api/oss')
app.use('/api/oss', ossRoutes)

// ============================================================
// 批量导入
// ============================================================
const importRoutes = require('./api/import')
app.use('/api/import', importRoutes)

// 知乎抓取
const zhihuCrawler = require('./api/crawler/zhihu')
app.use('/api/crawler/zhihu', zhihuCrawler)

// 知乎抓取（Feedloom）
const zhihuFeedloom = require('./api/crawler/zhihu-feedloom')
app.use('/api/crawler/zhihu-feedloom', zhihuFeedloom)

// ============================================================
// 静态文件服务（放在 API 路由之后）
// ============================================================
// ✅ 提供管理后台静态文件
app.use(express.static('/www/wwwroot/admin'))


// ✅ 所有非 API 请求返回 index.html（SPA 支持）
app.get('*', (req, res) => {
  res.sendFile(path.join('/www/wwwroot/admin', 'index.html'))
})




// ============================================================
// 404 处理（放在最后）
// ============================================================
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

// ============================================================
// 错误处理
// ============================================================
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' })
})

// ============================================================
// 启动服务
// ============================================================
const PORT = config.port

async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
	
	if (process.env.NODE_ENV === 'development') {
	  await sequelize.sync({ alter: true })
	} else {
	  await sequelize.sync()
	}    
    console.log('✅ 数据模型同步完成')
    
    // 初始化默认数据
    await initDefaultData()
    
    app.listen(PORT, () => {
      console.log('='.repeat(50))
      console.log(`🚀 知识付费后端服务已启动`)
      console.log(`📡 地址: http://localhost:${PORT}`)
      console.log(`📝 健康检查: http://localhost:${PORT}/api/health`)
      console.log(`🌐 管理后台: http://localhost:${PORT}`)
      console.log('='.repeat(50))
    })
  } catch (error) {
    console.error('❌ 服务启动失败:', error)
    process.exit(1)
  }
}

// ============================================================
// 初始化默认数据
// ============================================================
async function initDefaultData() {
  const { Category, Setting, User } = require('./models')
  
  // 初始化分类
  const categoryCount = await Category.count()
  if (categoryCount === 0) {
    await Category.bulkCreate([
      { name: '前端开发', icon: '💻', sort_order: 1 },
      { name: '后端架构', icon: '⚙️', sort_order: 2 },
      { name: '产品设计', icon: '🎨', sort_order: 3 },
      { name: '运营增长', icon: '📈', sort_order: 4 },
      { name: 'AI 技术', icon: '🤖', sort_order: 5 },
      { name: '职场成长', icon: '🚀', sort_order: 6 }
    ])
    console.log('✅ 默认分类已创建')
  }
  
  // 初始化系统设置
  const settingCount = await Setting.count()
  if (settingCount === 0) {
    await Setting.bulkCreate([
      { key: 'exchange_rate', value: '10', description: '积分汇率（1元 = ? 积分）' },
      { key: 'ad_enabled', value: 'true', description: '广告开关' },
      { key: 'ad_daily_limit', value: '10', description: '广告每日上限' },
      { key: 'ad_reward_points', value: '5', description: '广告观看奖励积分' },
      { key: 'ad_cooldown', value: '30', description: '广告冷却时间（秒）' }
    ])
    console.log('✅ 默认系统设置已创建')
  }
  
  // 创建默认管理员
  const adminCount = await User.count({ where: { phone: '13800138000' } })
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('123456', 10)
    await User.create({
      phone: '13800138000',
      nickname: '管理员',
      password: hashedPassword,
      points: 0,
      status: 1
    })
    console.log('✅ 默认管理员已创建（手机号: 13800138000, 密码: 123456）')
  }
}

startServer()