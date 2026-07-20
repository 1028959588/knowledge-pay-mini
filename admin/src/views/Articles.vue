<template>
  <div class="page-container">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <div class="header-left">
        <span class="page-title">📄 内容管理</span>
        <el-tag size="small" type="info">共 {{ stats.all || 0 }} 篇文章</el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button type="primary" @click="$router.push('/articles/create')">
          <el-icon><Plus /></el-icon> 发布文章
        </el-button>
      </div>
    </div>

    <!-- ===== 统计卡片（从后端获取真实数据） ===== -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <div class="stat-card" @click="filterByStatus('')" :class="{ active: searchForm.status === '' && searchForm.is_top === '' }">
          <div class="stat-icon blue">📄</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.all || 0 }}</div>
            <div class="stat-label">全部文章</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" @click="filterByStatus(1)" :class="{ active: searchForm.status === 1 }">
          <div class="stat-icon green">✅</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.published || 0 }}</div>
            <div class="stat-label">已发布</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" @click="filterByStatus(0)" :class="{ active: searchForm.status === 0 }">
          <div class="stat-icon orange">📝</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.draft || 0 }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" @click="filterByTop()" :class="{ active: searchForm.is_top === 1 }">
          <div class="stat-icon purple">⭐</div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.top || 0 }}</div>
            <div class="stat-label">置顶</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ===== 搜索与筛选 ===== -->
    <div class="search-wrapper">
      <el-form :inline="true" :model="searchForm" class="search-form" size="default">
        <el-form-item label="标题">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入标题关键词" 
            clearable 
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            prefix-icon="Search"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select 
            v-model="searchForm.category_id" 
            placeholder="全部分类" 
            clearable 
            @change="handleSearch"
            style="width: 150px"
          >
            <el-option label="📚 全部分类" value="" />
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.icon + ' ' + cat.name" 
              :value="cat.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select 
            v-model="searchForm.type" 
            placeholder="全部类型" 
            clearable 
            @change="handleSearch"
            style="width: 130px"
          >
            <el-option label="📋 全部类型" value="" />
            <el-option label="🆓 免费" :value="1" />
            <el-option label="💎 积分支付" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

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
        
        <el-table-column prop="cover" label="封面" width="80" align="center">
          <template #default="{ row }">
            <el-image 
              :src="row.cover || '/default-cover.png'" 
              style="width: 56px; height: 38px; border-radius: 4px;" 
              fit="cover"
              :preview-src-list="row.cover ? [row.cover] : []"
            >
              <template #error>
                <div style="width: 56px; height: 38px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                  📷
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="180">
          <template #default="{ row }">
            <div class="title-cell">
              <div class="title-text">{{ row.title }}</div>
              <div class="title-sub" v-if="row.subtitle">{{ row.subtitle }}</div>
              <el-tag v-if="row.status === 0" size="small" type="warning" style="margin-top: 4px;">
                📝 草稿
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="category_name" label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.category_name || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'warning'" size="small">
              {{ row.type === 1 ? '🆓 免费' : '💎 积分' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="points_required" label="所需积分" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.type === 2">{{ row.points_required }} 积分</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="view_count" label="浏览量" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.view_count || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="pay_count" label="付费次数" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.pay_count || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="is_top" label="置顶" width="60" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_top === 1 ? 'danger' : 'info'" size="small">
              {{ row.is_top === 1 ? '⭐' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        
		<el-table-column prop="publish_time" label="发布时间" width="170" align="center">
		  <template #default="{ row }">
			<span style="font-size: 13px; color: #606266;">
			  {{ formatDateTime(row.publish_time) }}
			</span>
		  </template>
		</el-table-column>
        
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                v-if="row.status === 0"
                size="small" 
                type="success"
                plain
                @click="handlePublish(row)"
              >
                发布
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="$router.push(`/articles/edit/${row.id}`)"
              >
                编辑
              </el-button>
              <el-button 
                v-if="row.status === 1"
                size="small" 
                :type="row.status === 1 ? 'warning' : 'success'" 
                plain
                @click="handleStatus(row)"
              >
                {{ row.status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button 
                size="small" 
                :type="row.is_top === 1 ? 'warning' : 'primary'" 
                plain
                @click="handleTop(row)"
              >
                {{ row.is_top === 1 ? '取消置顶' : '置顶' }}
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

    <!-- ===== 分页 ===== -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:page-size="pageSize"
        v-model:current-page="currentPage"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { articleAPI, categoryAPI } from '@/api'

// ============================================================
// 响应式数据
// ============================================================
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const categories = ref([])

// ✅ 统计数据
const stats = reactive({
  all: 0,
  published: 0,
  draft: 0,
  top: 0
})

const searchForm = reactive({
  keyword: '',
  category_id: '',
  type: '',
  status: '',
  is_top: ''
})

// ============================================================
// 格式化时间
// ============================================================
const formatDateTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}


// ============================================================
// 加载分类
// ============================================================
const loadCategories = async () => {
  try {
    const res = await categoryAPI.list()
    categories.value = res || []
  } catch (err) {
    console.error('❌ 加载分类失败:', err)
  }
}

// ============================================================
// 加载文章列表
// ============================================================
const loadData = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.category_id) params.category_id = searchForm.category_id
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.status !== '') params.status = searchForm.status
    if (searchForm.is_top !== '') params.is_top = searchForm.is_top
    
    const res = await articleAPI.list(params)
    console.log('📄 文章列表:', res)
    
    tableData.value = res?.list || []
    total.value = res?.total || 0
    
    // ✅ 更新统计数据
    if (res?.stats) {
      stats.all = res.stats.all || 0
      stats.published = res.stats.published || 0
      stats.draft = res.stats.draft || 0
      stats.top = res.stats.top || 0
    }
    
  } catch (err) {
    console.error('❌ 加载文章失败:', err)
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// ============================================================
// 统计卡片筛选
// ============================================================
const filterByStatus = (status) => {
  if (status === '') {
    searchForm.status = ''
    searchForm.is_top = ''
  } else if (status === 1) {
    searchForm.status = 1
    searchForm.is_top = ''
  } else if (status === 0) {
    searchForm.status = 0
    searchForm.is_top = ''
  }
  currentPage.value = 1
  loadData()
}

const filterByTop = () => {
  searchForm.is_top = searchForm.is_top === 1 ? '' : 1
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// ============================================================
// 搜索与重置
// ============================================================
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category_id = ''
  searchForm.type = ''
  searchForm.status = ''
  searchForm.is_top = ''
  currentPage.value = 1
  loadData()
}

// ============================================================
// 发布草稿
// ============================================================
const handlePublish = (row) => {
  ElMessageBox.confirm(
    `确定要发布草稿「${row.title}」吗？`,
    '发布确认',
    { type: 'info' }
  ).then(async () => {
    try {
      await articleAPI.updateStatus(row.id, 1)
      ElMessage.success('✅ 发布成功')
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '发布失败')
    }
  }).catch(() => {})
}

// ============================================================
// 上下架
// ============================================================
const handleStatus = (row) => {
  const action = row.status === 1 ? '下架' : '上架'
  ElMessageBox.confirm(
    `确定要${action}文章「${row.title}」吗？`,
    '操作确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await articleAPI.updateStatus(row.id, row.status === 1 ? 0 : 1)
      ElMessage.success(`✅ ${action}成功`)
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '操作失败')
    }
  }).catch(() => {})
}

// ============================================================
// 置顶/取消置顶
// ============================================================
const handleTop = (row) => {
  const action = row.is_top === 1 ? '取消置顶' : '置顶'
  ElMessageBox.confirm(
    `确定要${action}文章「${row.title}」吗？`,
    '操作确认'
  ).then(async () => {
    try {
      await articleAPI.updateTop(row.id, row.is_top === 1 ? 0 : 1)
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
    `确定要删除文章「${row.title}」吗？\n删除后不可恢复！`,
    '⚠️ 警告',
    { type: 'error' }
  ).then(async () => {
    try {
      await articleAPI.delete(row.id)
      ElMessage.success('✅ 删除成功')
      loadData()
    } catch (err) {
      ElMessage.error(err.message || '删除失败')
    }
  }).catch(() => {})
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadCategories()
  loadData()
})
</script>

<style lang="scss" scoped>
$primary: #6C5CE7;

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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
}

.stat-card.active {
  border-color: $primary;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.15);
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
}

.stat-icon.blue { background: #E8F0FE; }
.stat-icon.green { background: #E8F8EE; }
.stat-icon.orange { background: #FDF6EC; }
.stat-icon.purple { background: #F0EDFF; }

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

.search-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.title-cell .title-text {
  font-weight: 500;
  color: #303133;
}

.title-cell .title-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>