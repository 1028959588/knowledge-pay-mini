<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">用户管理</span>
      <el-button type="primary" @click="handleAddUser">添加用户</el-button>
    </div>

    <!-- 搜索 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="关键词">
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="请输入昵称/手机号" 
          clearable 
          @clear="loadData"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 统计 -->
    <div class="stats-row">
      <span>共 <strong>{{ total }}</strong> 位用户</span>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="avatar" label="头像" width="60">
        <template #default="{ row }">
          <el-avatar :size="32" :src="row.avatar">
            {{ row.nickname?.charAt(0) || 'U' }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" min-width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="points" label="积分余额" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="170" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleView(row)">详情</el-button>
          <el-button size="small" @click="handlePoints(row)">调整积分</el-button>
          <el-button 
            size="small" 
            :type="row.status === 1 ? 'warning' : 'success'" 
            @click="handleStatus(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:page-size="pageSize"
      v-model:current-page="currentPage"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end"
    />

    <!-- 调整积分弹窗 -->
    <el-dialog v-model="pointsDialogVisible" title="调整积分" width="420px">
      <el-form :model="pointsForm" label-width="100px">
        <el-form-item label="用户">
          <span>{{ pointsForm.nickname }}</span>
        </el-form-item>
        <el-form-item label="当前积分">
          <span>{{ pointsForm.currentPoints }}</span>
        </el-form-item>
        <el-form-item label="调整数量">
          <el-input-number v-model="pointsForm.amount" :min="-9999" :max="9999" />
          <span style="margin-left: 12px; color: #909399;">（正数增加，负数减少）</span>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="pointsForm.reason" type="textarea" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pointsLoading" @click="submitPoints">确认调整</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="500px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detailData.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ detailData.points }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detailData.created_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userAPI } from '@/api'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const searchForm = reactive({
  keyword: '',
  status: ''
})

// 调整积分
const pointsDialogVisible = ref(false)
const pointsLoading = ref(false)
const pointsForm = reactive({
  userId: null,
  nickname: '',
  currentPoints: 0,
  amount: 0,
  reason: ''
})

// 用户详情
const detailVisible = ref(false)
const detailData = ref(null)

// ============================================================
// 加载数据
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status !== '') params.status = searchForm.status
    
    const data = await userAPI.list(params)
    console.log('用户列表:', data)
    
    tableData.value = data.list
    total.value = data.total
  } catch (err) {
    console.error('加载用户列表失败:', err)
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// ============================================================
// 用户详情
// ============================================================
const handleView = async (row) => {
  try {
    const data = await userAPI.detail(row.id)
    detailData.value = data
    detailVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || '获取详情失败')
  }
}

// ============================================================
// 调整积分
// ============================================================
const handlePoints = (row) => {
  pointsForm.userId = row.id
  pointsForm.nickname = row.nickname
  pointsForm.currentPoints = row.points
  pointsForm.amount = 0
  pointsForm.reason = ''
  pointsDialogVisible.value = true
}

const submitPoints = async () => {
  if (pointsForm.amount === 0) {
    ElMessage.warning('请调整积分数量')
    return
  }
  
  pointsLoading.value = true
  
  try {
    await userAPI.updatePoints(
      pointsForm.userId,
      pointsForm.amount,
      pointsForm.reason || '管理员调整'
    )
    
    ElMessage.success(`已${pointsForm.amount > 0 ? '增加' : '减少'} ${Math.abs(pointsForm.amount)} 积分`)
    pointsDialogVisible.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.message || '调整失败')
  } finally {
    pointsLoading.value = false
  }
}

// ============================================================
// 禁用/启用用户
// ============================================================
const handleStatus = (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户 ${row.nickname} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userAPI.updateStatus(row.id, row.status === 1 ? 0 : 1)
      ElMessage.success(`${action}成功`)
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '操作失败')
    }
  }).catch(() => {})
}

// ============================================================
// 添加用户
// ============================================================
const handleAddUser = () => {
  ElMessage.info('添加用户功能开发中')
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
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
  font-size: 14px;
  color: #909399;
  
  strong {
    color: #303133;
    font-size: 18px;
  }
}
</style>