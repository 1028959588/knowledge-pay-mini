<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">付费订单</span>
    </div>

    <!-- 统计 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">总付费金额</div>
          <div class="stat-value">¥{{ totalAmount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">总付费次数</div>
          <div class="stat-value">{{ totalCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">积分解锁</div>
          <div class="stat-value">{{ pointsCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">微信支付</div>
          <div class="stat-value">{{ wechatCount }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="内容标题">
        <el-input v-model="searchForm.title" placeholder="请输入标题" clearable />
      </el-form-item>
      <el-form-item label="用户">
        <el-input v-model="searchForm.user" placeholder="请输入用户昵称" clearable />
      </el-form-item>
      <el-form-item label="支付方式">
        <el-select v-model="searchForm.pay_type" placeholder="选择方式" clearable>
          <el-option label="全部" value="" />
          <el-option label="积分支付" :value="1" />
          <el-option label="微信支付" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="user_nickname" label="用户" />
      <el-table-column prop="article_title" label="付费内容" min-width="150" />
      <el-table-column prop="pay_type" label="支付方式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.pay_type === 1 ? 'warning' : 'success'">
            {{ row.pay_type === 1 ? '积分解锁' : '微信支付' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额/积分" width="120">
        <template #default="{ row }">
          {{ row.pay_type === 1 ? row.points_cost + '积分' : '¥' + row.amount }}
        </template>
      </el-table-column>
      <el-table-column prop="paid_at" label="支付时间" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleView(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:page-size="pageSize"
      v-model:current-page="currentPage"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="付费详情" width="500px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="用户">{{ detailData.user_nickname }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ detailData.article_title }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag :type="detailData.pay_type === 1 ? 'warning' : 'success'">
            {{ detailData.pay_type === 1 ? '积分解锁' : '微信支付' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额/积分">
          {{ detailData.pay_type === 1 ? detailData.points_cost + '积分' : '¥' + detailData.amount }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ detailData.paid_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const totalAmount = ref(0)
const totalCount = ref(0)
const pointsCount = ref(0)
const wechatCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const detailData = ref(null)

const searchForm = reactive({
  title: '',
  user: '',
  pay_type: ''
})

const loadData = () => {
  loading.value = true
  
  // TODO: 调用 API
  setTimeout(() => {
    tableData.value = [
      { id: 1, user_nickname: '用户_1234', article_title: 'Vue 3 入门到精通', pay_type: 1, points_cost: 30, amount: 0, paid_at: '2026-07-08 15:00' },
      { id: 2, user_nickname: '微信用户', article_title: '微服务架构设计与实践', pay_type: 1, points_cost: 50, amount: 0, paid_at: '2026-07-08 11:20' },
      { id: 3, user_nickname: '用户_5678', article_title: 'AI 时代产品经理的必备技能', pay_type: 2, points_cost: 0, amount: 9.9, paid_at: '2026-07-07 20:00' },
      { id: 4, user_nickname: '用户_9012', article_title: '从程序员到技术管理者', pay_type: 1, points_cost: 35, amount: 0, paid_at: '2026-07-06 18:30' },
    ]
    total.value = 4
    
    // 计算统计
    let totalAmt = 0
    let totalCnt = 0
    let pointsCnt = 0
    let wechatCnt = 0
    
    tableData.value.forEach(item => {
      totalCnt++
      if (item.pay_type === 1) {
        pointsCnt++
      } else {
        wechatCnt++
        totalAmt += item.amount
      }
    })
    
    totalAmount.value = totalAmt.toFixed(2)
    totalCount.value = totalCnt
    pointsCount.value = pointsCnt
    wechatCount.value = wechatCnt
    
    loading.value = false
  }, 500)
}

const resetSearch = () => {
  searchForm.title = ''
  searchForm.user = ''
  searchForm.pay_type = ''
  loadData()
}

const handleView = (row) => {
  detailData.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
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
}

.search-form {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>