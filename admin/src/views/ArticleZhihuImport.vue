<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">📥 知乎文章导入</span>
    </div>

    <el-card>
      <el-alert
        title="使用说明"
        type="info"
        description="输入知乎文章 URL，系统自动抓取标题、作者、内容、封面图"
        show-icon
        :closable="false"
      />

      <!-- URL 输入 -->
      <el-form style="margin-top: 20px;">
        <el-form-item label="知乎文章 URL">
          <el-input
            v-model="urlInput"
            type="textarea"
            :rows="6"
            placeholder="每行一个 URL，支持：&#10;https://zhuanlan.zhihu.com/p/xxxxx&#10;https://www.zhihu.com/question/xxxxx/answer/xxxxx"
          />
        </el-form-item>

        <el-form-item label="目标分类">
          <el-select v-model="categoryId" placeholder="选择分类" style="width: 200px">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文章类型">
          <el-radio-group v-model="articleType">
            <el-radio :label="1">免费</el-radio>
            <el-radio :label="2">积分支付</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="自动发布">
          <el-switch v-model="autoPublish" />
          <span style="margin-left: 12px; color: #909399;">
            {{ autoPublish ? '抓取后直接发布' : '保存为草稿' }}
          </span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleFetch" :loading="fetching">
            <el-icon><Link /></el-icon> {{ fetching ? '抓取中...' : '抓取并导入' }}
          </el-button>
          <el-button @click="clearAll">清空</el-button>
        </el-form-item>
      </el-form>

      <!-- 预览区域 -->
      <div v-if="previewItems.length > 0" class="preview-section">
        <h4>抓取结果</h4>
        <el-table :data="previewItems" border stripe>
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="author" label="作者" width="120" />
          <el-table-column label="封面" width="100">
            <template #default="{ row }">
              <el-image
                v-if="row.cover"
                :src="row.cover"
                style="width: 60px; height: 40px; border-radius: 4px;"
                fit="cover"
              />
              <span v-else style="color: #c0c4cc;">无封面</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : row.status === 'skipped' ? 'warning' : 'danger'">
                {{ row.status === 'success' ? '已导入' : row.status === 'skipped' ? '已存在' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" text @click="viewDetail(row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 导入结果 -->
      <div v-if="resultStats.total > 0" class="result-section">
        <el-divider />
        <el-result
          :icon="resultStats.success > 0 ? 'success' : 'info'"
          :title="`成功导入 ${resultStats.success} 篇`"
          :sub-title="`跳过 ${resultStats.skipped} 篇（已存在），失败 ${resultStats.fail} 篇`"
        />
        <div v-if="resultStats.errors && resultStats.errors.length > 0">
          <el-divider>错误详情</el-divider>
          <div v-for="err in resultStats.errors" :key="err.url" class="error-item">
            <span class="error-url">{{ err.url }}</span>
            <span class="error-msg">{{ err.error }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 文章预览弹窗 -->
    <el-dialog v-model="detailVisible" title="文章预览" width="70%">
      <div class="detail-content" v-html="detailContent"></div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { categoryAPI } from '@/api'
import { zhihuAPI } from '@/api/zhihu'

const categories = ref([])
const urlInput = ref('')
const categoryId = ref('')
const articleType = ref(1)
const autoPublish = ref(false)
const fetching = ref(false)
const previewItems = ref([])
const detailVisible = ref(false)
const detailContent = ref('')

const resultStats = reactive({
  success: 0,
  fail: 0,
  skipped: 0,
  total: 0,
  errors: []
})

// ============================================================
// 加载分类
// ============================================================
const loadCategories = async () => {
  try {
    const data = await categoryAPI.list()
    categories.value = data || []
    if (categories.value.length > 0) {
      categoryId.value = categories.value[0].id
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

// ============================================================
// 抓取并导入
// ============================================================
const handleFetch = async () => {
  const urls = urlInput.value.split('\n').filter(u => u.trim())
  
  if (urls.length === 0) {
    ElMessage.warning('请输入至少一个 URL')
    return
  }
  
  if (!categoryId.value) {
    ElMessage.warning('请选择目标分类')
    return
  }
  
  fetching.value = true
  previewItems.value = []
  Object.assign(resultStats, { success: 0, fail: 0, skipped: 0, total: 0, errors: [] })
  
  try {
    const res = await zhihuAPI.fetch(urls, categoryId.value, articleType.value, autoPublish.value)
    console.log('📥 抓取结果:', res)
    
    const data = res.data
    resultStats.success = data.success || 0
    resultStats.fail = data.fail || 0
    resultStats.skipped = data.skipped || 0
    resultStats.total = data.success + data.fail + data.skipped
    resultStats.errors = data.errors || []
    
    // 显示每个文章的结果
    if (data.items) {
      previewItems.value = data.items
    }
    
    ElMessage.success(data.message || '抓取完成')
    
  } catch (err) {
    console.error('❌ 抓取失败:', err)
    ElMessage.error(err.message || '抓取失败')
  } finally {
    fetching.value = false
  }
}

// ============================================================
// 预览文章
// ============================================================
const viewDetail = (row) => {
  detailContent.value = row.content || '暂无内容'
  detailVisible.value = true
}

// ============================================================
// 清空
// ============================================================
const clearAll = () => {
  urlInput.value = ''
  previewItems.value = []
  Object.assign(resultStats, { success: 0, fail: 0, skipped: 0, total: 0, errors: [] })
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadCategories()
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

.preview-section {
  margin-top: 20px;
}

.result-section {
  margin-top: 20px;
}

.error-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
  
  .error-url {
    color: #303133;
    word-break: break-all;
    margin-right: 16px;
  }
  
  .error-msg {
    color: #f56c6c;
    flex-shrink: 0;
  }
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
}
</style>