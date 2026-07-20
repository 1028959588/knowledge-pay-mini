<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <span class="page-title">📂 分类管理</span>
        <el-tag size="small" type="info">共 {{ tableData.length }} 个分类</el-tag>
      </div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 添加分类
      </el-button>
    </div>

    <!-- ===== 统计卡片 ===== -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon blue">📂</div>
          <div class="stat-info">
            <div class="stat-number">{{ tableData.length }}</div>
            <div class="stat-label">全部分类</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div class="stat-info">
            <div class="stat-number">{{ activeCount }}</div>
            <div class="stat-label">已启用</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon orange">⛔</div>
          <div class="stat-info">
            <div class="stat-number">{{ inactiveCount }}</div>
            <div class="stat-label">已禁用</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ===== 表格 ===== -->
    <div class="table-wrapper">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading"
        stripe
        border
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <span style="font-size: 32px;">{{ row.icon || '📚' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="分类名称" min-width="150">
          <template #default="{ row }">
            <div class="name-cell">
              <span class="name-text">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="sort_order" label="排序" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.sort_order || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '✅ 启用' : '⛔ 禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            <span style="font-size: 13px; color: #606266;">
              {{ formatDate(row.created_at) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="openDialog(row)"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                :type="row.status === 1 ? 'warning' : 'success'" 
                plain
                @click="handleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                plain
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ===== 弹窗（新增/编辑） ===== -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="dialogForm" 
        :rules="dialogRules" 
        ref="dialogFormRef" 
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="dialogForm.name" 
            placeholder="请输入分类名称" 
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-input 
            v-model="dialogForm.icon" 
            placeholder="请输入 Emoji 图标，如：💻" 
            maxlength="4"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            💡 支持 Emoji 表情，点击右侧 emoji 键盘选择
          </div>
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number 
            v-model="dialogForm.sort_order" 
            :min="0" 
            :max="999" 
            controls-position="right"
          />
          <span style="margin-left: 12px; color: #909399; font-size: 12px;">
            数字越小越靠前
          </span>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch 
            v-model="dialogForm.status" 
            :active-value="1" 
            :inactive-value="0"
            active-color="#67C23A"
            inactive-color="#F56C6C"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="dialogLoading" 
          @click="submitDialog"
        >
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { categoryAPI } from '@/api'

// ============================================================
// 响应式数据
// ============================================================
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogTitle = ref('添加分类')
const isEdit = ref(false)

const dialogFormRef = ref()
const dialogForm = reactive({
  id: null,
  name: '',
  icon: '',
  sort_order: 0,
  status: 1
})

// ============================================================
// 计算属性
// ============================================================
const activeCount = computed(() => {
  return tableData.value.filter(item => item.status === 1).length
})

const inactiveCount = computed(() => {
  return tableData.value.filter(item => item.status === 0).length
})

// ============================================================
// 表单验证规则
// ============================================================
const dialogRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// ============================================================
// 加载分类列表
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    const data = await categoryAPI.list()
    console.log('📂 分类数据:', data)
    
    // 处理不同返回格式
    if (Array.isArray(data)) {
      tableData.value = data
    } else if (data && Array.isArray(data.data)) {
      tableData.value = data.data
    } else {
      tableData.value = []
    }
    
    console.log('✅ 分类加载完成，共', tableData.value.length, '条')
  } catch (err) {
    console.error('❌ 加载分类失败:', err)
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// ============================================================
// 打开弹窗
// ============================================================
const openDialog = (row) => {
  if (row) {
    // 编辑模式
    isEdit.value = true
    dialogTitle.value = '✏️ 编辑分类'
    Object.assign(dialogForm, {
      id: row.id,
      name: row.name || '',
      icon: row.icon || '',
      sort_order: row.sort_order || 0,
      status: row.status !== undefined ? row.status : 1
    })
  } else {
    // 新增模式
    isEdit.value = false
    dialogTitle.value = '➕ 添加分类'
    Object.assign(dialogForm, {
      id: null,
      name: '',
      icon: '',
      sort_order: 0,
      status: 1
    })
  }
  
  dialogVisible.value = true
}

// ============================================================
// 提交表单
// ============================================================
const submitDialog = async () => {
  await dialogFormRef.value.validate()
  
  dialogLoading.value = true
  
  try {
    const data = {
      name: dialogForm.name.trim(),
      icon: dialogForm.icon || '📚',
      sort_order: dialogForm.sort_order || 0,
      status: dialogForm.status
    }
    
    if (isEdit.value) {
      await categoryAPI.update(dialogForm.id, data)
      ElMessage.success('✅ 分类更新成功')
    } else {
      await categoryAPI.create(data)
      ElMessage.success('✅ 分类添加成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (err) {
    console.error('❌ 提交失败:', err)
    ElMessage.error(err.message || '操作失败')
  } finally {
    dialogLoading.value = false
  }
}

// ============================================================
// 禁用/启用
// ============================================================
const handleStatus = (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  const newStatus = row.status === 1 ? 0 : 1
  
  ElMessageBox.confirm(
    `确定要${action}分类「${row.name}」吗？`,
    '操作确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await categoryAPI.update(row.id, { ...row, status: newStatus })
      ElMessage.success(`✅ ${action}成功`)
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '操作失败')
    }
  }).catch(() => {})
}

// ============================================================
// 删除
// ============================================================
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除分类「${row.name}」吗？\n删除后不可恢复！`,
    '⚠️ 警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(async () => {
    try {
      await categoryAPI.delete(row.id)
      ElMessage.success('✅ 删除成功')
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '删除失败')
    }
  }).catch(() => {})
}

// ============================================================
// 工具函数
// ============================================================
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;
$success: #67C23A;
$warning: #E6A23C;
$danger: #F56C6C;

.page-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

// ============================================================
// 页面头部
// ============================================================
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }
}

// ============================================================
// 统计卡片
// ============================================================
.stats-cards {
  margin-bottom: 20px;
  
  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
      
      &.blue {
        background: #E8F0FE;
      }
      &.green {
        background: #E8F8EE;
      }
      &.orange {
        background: #FDF6EC;
      }
    }
    
    .stat-info {
      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }
}

// ============================================================
// 表格
// ============================================================
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .name-cell {
    .name-text {
      font-weight: 500;
      color: #303133;
    }
  }
}
</style>