<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">📊 数据总览</span>
      <el-button size="small" @click="loadData" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新数据
      </el-button>
    </div>

    <!-- ===== 统计卡片 ===== -->
    <el-row :gutter="20" class="stat-row" v-loading="loading">
      <el-col :span="4" v-for="stat in stats" :key="stat.label">
        <div class="stat-card">
          <div class="stat-title">{{ stat.label }}</div>
          <div class="stat-value">
            {{ typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value }}
          </div>
          <div class="stat-change" :class="stat.change > 0 ? 'up' : stat.change < 0 ? 'down' : 'zero'">
            <span v-if="stat.change > 0">↑</span>
            <span v-else-if="stat.change < 0">↓</span>
            <span v-else>-</span>
            {{ Math.abs(stat.change) }}%
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ===== 图表 ===== -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
            <span>📈 收入趋势</span>
            <el-radio-group v-model="trendType" size="small" @change="loadChartData">
              <el-radio-button label="week">近7天</el-radio-button>
              <el-radio-button label="month">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <span>📊 内容类型分布</span>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ===== 最近订单 ===== -->
    <div class="chart-card" style="margin-top: 20px">
      <div class="chart-header">
        <span>🕐 最近充值订单</span>
        <el-button size="small" text @click="$router.push('/orders/recharge')">
          查看全部
        </el-button>
      </div>
      <el-table :data="recentOrders" style="width: 100%" v-loading="orderLoading">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_nickname" label="用户" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="points_gained" label="获得积分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已支付' : '待支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paid_at" label="支付时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { dashboardAPI, orderAPI } from '@/api'
import { Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const orderLoading = ref(false)
const trendType = ref('week')
const trendChartRef = ref()
const pieChartRef = ref()

const stats = ref([
  { label: '总用户数', value: 0, change: 0 },
  { label: '今日新增', value: 0, change: 0 },
  { label: '总文章数', value: 0, change: 0 },
  { label: '今日发布', value: 0, change: 0 },
  { label: '充值总额', value: '¥0.00', change: 0 },
  { label: '积分消耗', value: 0, change: 0 }
])

const recentOrders = ref([])

// ============================================================
// 格式化数字
// ============================================================
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

// ============================================================
// 加载数据
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    const data = await dashboardAPI.getStats()
    console.log('📊 仪表盘数据:', data)
    
    stats.value = [
      { label: '总用户数', value: data.totalUsers || 0, change: data.userGrowth || 0 },
      { label: '今日新增', value: data.todayUsers || 0, change: 0 },
      { label: '总文章数', value: data.totalArticles || 0, change: data.articleGrowth || 0 },
      { label: '今日发布', value: data.todayArticles || 0, change: 0 },
      { label: '充值总额', value: '¥' + (data.totalRecharge || '0.00'), change: 0 },
      { label: '积分消耗', value: data.totalPointsCost || 0, change: 0 }
    ]
    
    loadChartData()
    loadRecentOrders()
    
  } catch (err) {
    console.error('加载仪表盘数据失败:', err)
  } finally {
    loading.value = false
  }
}

// ============================================================
// 加载图表数据
// ============================================================
const loadChartData = () => {
  // 模拟数据 - 实际应从API获取
  const chartData = {
    week: {
      dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      values: [120, 200, 150, 280, 180, 340, 260]
    },
    month: {
      dates: Array.from({length: 30}, (_, i) => `${i+1}日`),
      values: Array.from({length: 30}, () => Math.floor(Math.random() * 300) + 50)
    }
  }
  
  const data = chartData[trendType.value]
  initTrendChart(data.dates, data.values)
  initPieChart()
}

// ============================================================
// 加载最近订单
// ============================================================
const loadRecentOrders = async () => {
  orderLoading.value = true
  try {
    const data = await orderAPI.rechargeList({ page: 1, limit: 5 })
    recentOrders.value = data?.list || []
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    orderLoading.value = false
  }
}

// ============================================================
// 图表初始化
// ============================================================
const initTrendChart = (dates, values) => {
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      lineStyle: { color: '#6C5CE7', width: 3 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(108, 92, 231, 0.3)' },
          { offset: 1, color: 'rgba(108, 92, 231, 0.05)' }
        ])
      },
      itemStyle: { color: '#6C5CE7' }
    }]
  })
  
  // 窗口变化时自适应
  window.addEventListener('resize', () => chart.resize())
}

const initPieChart = () => {
  const chart = echarts.init(pieChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: 335, name: '积分解锁', itemStyle: { color: '#6C5CE7' } },
        { value: 210, name: '微信支付', itemStyle: { color: '#A29BFE' } },
        { value: 45, name: '免费内容', itemStyle: { color: '#DFE6E9' } }
      ]
    }]
  })
  
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  .stat-title {
    font-size: 14px;
    color: #909399;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin-top: 8px;
  }
  
  .stat-change {
    font-size: 12px;
    margin-top: 8px;
    
    &.up {
      color: #67c23a;
    }
    &.down {
      color: #f56c6c;
    }
    &.zero {
      color: #909399;
    }
  }
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>