<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">充值订单</span>
    </div>

    <!-- 搜索 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
      </el-form-item>
      <el-form-item label="用户">
        <el-input v-model="searchForm.user" placeholder="请输入用户昵称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
          <el-option label="全部" value="" />
          <el-option label="待支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="已取消" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="order_no" label="订单号" width="180" />
      <el-table-column prop="user_nickname" label="用户" />
      <el-table-column prop="amount" label="金额" width="100">
        <template #default="{ row }">¥{{ row.amount }}</template>
      </el-table-column>
      <el-table-column prop="points_gained" label="获得积分" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
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
    <el-dialog v-model="detailVisible" title="订单详情" width="500px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="订单号">{{ detailData.order_no }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detailData.user_nickname }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ detailData.amount }}</el-descriptions-item>
        <el-descriptions-item label="获得积分">{{ detailData.points_gained }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ detailData.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
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
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const detailData = ref(null)

const searchForm = reactive({
  order_no: '',
  user: '',
  status: ''
})

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待支付', 1: '已支付', 2: '已取消' }
  return map[status] || '未知'
}

const loadData = () => {
  loading.value = true
  
  // TODO: 调用 API
  setTimeout(() => {
    tableData.value = [
      { order_no: 'ORD20260708001', user_nickname: '用户_1234', amount: 12, points_gained: 150, status: 1, paid_at: '2026-07-08 14:30', created_at: '2026-07-08 14:25' },
      { order_no: 'ORD20260708002', user_nickname: '微信用户', amount: 6, points_gained: 70, status: 1, paid_at: '2026-07-08 10:20', created_at: '2026-07-08 10:15' },
      { order_no: 'ORD20260707001', user_nickname: '用户_5678', amount: 30, points_gained: 380, status: 0, paid_at: '-', created_at: '2026-07-07 09:00' },
      { order_no: 'ORD20260706001', user_nickname: '用户_9012', amount: 68, points_gained: 880, status: 1, paid_at: '2026-07-06 16:30', created_at: '2026-07-06 16:20' },
    ]
    total.value = 4
    loading.value = false
  }, 500)
}

const resetSearch = () => {
  searchForm.order_no = ''
  searchForm.user = ''
  searchForm.status = ''
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
.search-form {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>