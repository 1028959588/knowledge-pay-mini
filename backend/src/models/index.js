const { Sequelize, DataTypes } = require('sequelize')
const config = require('../config')

const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

// ============================================================
// 用户表
// ============================================================
const User = sequelize.define('User', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(100), unique: true },
  phone: { type: DataTypes.STRING(20), unique: true },
  email: { type: DataTypes.STRING(100), unique: true },  // ✅ 新增
  nickname: { type: DataTypes.STRING(50), defaultValue: '用户' },
  avatar: { type: DataTypes.STRING(500), defaultValue: '' },
  password: { type: DataTypes.STRING(100) },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  has_password: { type: DataTypes.TINYINT, defaultValue: 0 }  // ✅ 新增
}, { tableName: 'users' })

// ============================================================
// 分类表
// ============================================================
const Category = sequelize.define('Category', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  icon: { type: DataTypes.STRING(20), defaultValue: '📚' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'categories' })

// ============================================================
// 文章表
// ============================================================
const Article = sequelize.define('Article', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  subtitle: { type: DataTypes.STRING(200), defaultValue: '' },
  cover: { type: DataTypes.STRING(500), defaultValue: '' },
  summary: { type: DataTypes.TEXT, defaultValue: '' },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  video_url: { type: DataTypes.STRING(500), defaultValue: '' },
  category_id: { type: DataTypes.BIGINT },
  type: { type: DataTypes.TINYINT, defaultValue: 1 },
  points_required: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_top: { type: DataTypes.TINYINT, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  publish_time: { type: DataTypes.DATE },
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  pay_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'articles' })

// ============================================================
// 签到记录表
// ============================================================
const CheckinRecord = sequelize.define('CheckinRecord', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  checkin_date: { type: DataTypes.DATEONLY, allowNull: false },
  continuous_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_replenish: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'checkin_records' })

// ============================================================
// 积分记录表
// ============================================================
const PointsRecord = sequelize.define('PointsRecord', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(30), allowNull: false },
  description: { type: DataTypes.STRING(200), defaultValue: '' }
}, { tableName: 'points_records' })

// ============================================================
// 解锁记录表
// ============================================================
const UnlockRecord = sequelize.define('UnlockRecord', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  article_id: { type: DataTypes.BIGINT, allowNull: false },
  points_cost: { type: DataTypes.INTEGER, defaultValue: 0 },
  unlocked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'unlock_records' })

// ============================================================
// 充值订单表
// ============================================================
const RechargeOrder = sequelize.define('RechargeOrder', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  order_no: { type: DataTypes.STRING(50), unique: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  points_gained: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.TINYINT, defaultValue: 0 },
  paid_at: { type: DataTypes.DATE }
}, { tableName: 'recharge_orders' })

// ============================================================
// Banner 表
// ============================================================
const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  image: { type: DataTypes.STRING(500), allowNull: false },
  link: { type: DataTypes.STRING(500), defaultValue: '' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'banners' })

// ============================================================
// 系统设置表
// ============================================================
const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  value: { type: DataTypes.TEXT },
  description: { type: DataTypes.STRING(200) }
}, { tableName: 'settings' })


// ============================================================
// 关联关系
// ============================================================
User.hasMany(CheckinRecord, { foreignKey: 'user_id' })
User.hasMany(PointsRecord, { foreignKey: 'user_id' })
User.hasMany(UnlockRecord, { foreignKey: 'user_id' })
User.hasMany(RechargeOrder, { foreignKey: 'user_id' })

Article.hasMany(UnlockRecord, { foreignKey: 'article_id' })
Article.belongsTo(Category, { foreignKey: 'category_id' })

// ✅ RechargeOrder 关联 User（如果需要反向查询）
RechargeOrder.belongsTo(User, { foreignKey: 'user_id' })

module.exports = {
  sequelize,
  User,
  Category,
  Article,
  CheckinRecord,
  PointsRecord,
  UnlockRecord,
  RechargeOrder,
  Banner,
  Setting
}