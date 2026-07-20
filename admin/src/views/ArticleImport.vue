<template>
  <div class="page-container">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <span class="page-title">📥 批量导入文章</span>
      <div class="header-actions">
        <el-button @click="downloadTemplate" type="primary" plain>
          <el-icon><Download /></el-icon> 下载 CSV 模板
        </el-button>
      </div>
    </div>

    <!-- ===== 主标签页 ===== -->
    <el-tabs v-model="activeTab" class="main-tabs">
      
      <!-- ========================================================== -->
      <!-- Tab 1: CSV 批量导入 -->
      <!-- ========================================================== -->
      <el-tab-pane label="📊 CSV 批量导入" name="csv">
        <el-card>
          <el-alert
            title="使用说明"
            type="info"
            description="下载模板，按格式填写文章信息后上传 CSV 文件，系统自动解析并导入"
            show-icon
            :closable="false"
          />

          <div class="upload-section">
            <el-upload
              ref="uploadRef"
              action="#"
              :auto-upload="false"
              :limit="1"
              :file-list="csvFileList"
              accept=".csv"
              @change="handleCsvChange"
              @remove="csvFileList = []"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon> 选择 CSV 文件
              </el-button>
              <template #tip>
                <div style="font-size: 12px; color: #909399; margin-top: 8px;">
                  支持 .csv 格式，请先下载模板
                </div>
              </template>
            </el-upload>
          </div>

          <!-- 数据预览 -->
          <div v-if="csvPreviewData.length > 0" class="preview-section">
            <h4>📋 数据预览（前 5 条）</h4>
            <el-table :data="csvPreviewData" border stripe>
              <el-table-column prop="title" label="标题" min-width="150" />
              <el-table-column prop="category_name" label="分类" width="100" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.type === '免费' ? 'success' : 'warning'">
                    {{ row.type || '免费' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="summary" label="简介" min-width="150" />
            </el-table>
          </div>

          <div v-if="csvPreviewData.length > 0" class="import-actions">
            <el-button type="success" @click="handleCsvImport" :loading="csvImporting" size="large">
              <el-icon><Upload /></el-icon> {{ csvImporting ? '导入中...' : '批量导入' }}
            </el-button>
            <el-button @click="clearCsvPreview">清空</el-button>
          </div>

          <div v-if="csvImportResult" class="import-result">
            <el-divider />
            <el-result
              :icon="csvImportResult.fail === 0 ? 'success' : 'warning'"
              :title="`成功导入 ${csvImportResult.success} 篇`"
              :sub-title="`失败 ${csvImportResult.fail} 篇`"
            />
            <div v-if="csvImportResult.errors && csvImportResult.errors.length > 0">
              <el-divider>错误详情</el-divider>
              <el-table :data="csvImportResult.errors" border stripe>
                <el-table-column prop="title" label="标题" min-width="150" />
                <el-table-column prop="error" label="错误原因" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ========================================================== -->
      <!-- Tab 2: RSS 订阅导入 -->
      <!-- ========================================================== -->
      <el-tab-pane label="📡 RSS 订阅导入" name="rss">
        <el-card>
          <el-alert
            title="使用说明"
            type="info"
            description="输入 RSS 地址，先预览文章列表，选择需要导入的文章后批量导入"
            show-icon
            :closable="false"
          />

          <el-form style="margin-top: 20px;">
            <el-form-item label="RSS 地址">
              <el-input v-model="rssUrl" placeholder="https://example.com/feed.xml" style="width: 500px" />
            </el-form-item>

            <el-form-item label="目标分类">
              <el-select v-model="rssCategoryId" placeholder="选择分类" style="width: 200px">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.icon + ' ' + cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleRssPreview" :loading="rssPreviewing">
                <el-icon><View /></el-icon> 预览文章
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="rssPreviewData.length > 0" class="preview-section">
            <div class="preview-header">
              <h4>{{ rssFeedTitle }}</h4>
              <el-tag type="info">共 {{ rssPreviewData.length }} 篇</el-tag>
              <el-tag v-if="rssDuplicateCount > 0" type="warning">已存在 {{ rssDuplicateCount }} 篇</el-tag>
            </div>

            <el-table ref="rssTableRef" :data="rssPreviewData" border stripe @selection-change="handleRssSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="title" label="标题" min-width="200">
                <template #default="{ row }">
                  <span :style="{ color: row.isDuplicate ? '#909399' : '#303133' }">{{ row.title }}</span>
                  <el-tag v-if="row.isDuplicate" size="small" type="info" style="margin-left: 8px;">已存在</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="author" label="作者" width="120" />
              <el-table-column prop="pubDate" label="发布时间" width="160">
                <template #default="{ row }">{{ formatDate(row.pubDate) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button size="small" text @click="previewRssDetail(row)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-card class="import-settings" shadow="never">
              <el-form inline>
                <el-form-item label="文章类型">
                  <el-radio-group v-model="rssImportType">
                    <el-radio :label="1">免费</el-radio>
                    <el-radio :label="2">积分支付</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="自动发布">
                  <el-switch v-model="rssAutoPublish" />
                  <span style="margin-left: 12px; color: #909399;">{{ rssAutoPublish ? '直接发布' : '保存为草稿' }}</span>
                </el-form-item>
                <el-form-item>
                  <el-button type="success" @click="handleRssImportSelected" :loading="rssImporting" :disabled="rssSelectedItems.length === 0">
                    导入选中 ({{ rssSelectedItems.length }})
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <div v-if="rssImportResult" class="import-result">
            <el-result
              :icon="rssImportResult.success > 0 ? 'success' : 'info'"
              :title="`成功导入 ${rssImportResult.success} 篇`"
              :sub-title="`跳过 ${rssImportResult.skipped || 0} 篇，失败 ${rssImportResult.fail || 0} 篇`"
            />
            <div v-if="rssImportResult.errors && rssImportResult.errors.length > 0">
              <el-divider>错误详情</el-divider>
              <el-table :data="rssImportResult.errors" border stripe>
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="error" label="错误原因" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ========================================================== -->
      <!-- Tab 3: 公众号抓取 -->
      <!-- ========================================================== -->
      <el-tab-pane label="📱 公众号抓取" name="wechat">
        <el-card>
          <el-alert
            title="使用说明"
            type="info"
            description="输入公众号文章链接，先预览内容，再选择需要导入的文章"
            show-icon
            :closable="false"
          >
            <template #default>
              <ul style="margin: 8px 0 0 20px; padding: 0; color: #909399; font-size: 13px;">
                <li>每行一个公众号文章链接</li>
                <li>先点击「预览」查看抓取结果</li>
                <li>勾选需要的文章，点击「导入选中」</li>
              </ul>
            </template>
          </el-alert>

          <el-form style="margin-top: 20px;">
            <el-form-item label="文章链接">
              <el-input
                v-model="wechatUrls"
                type="textarea"
                :rows="4"
                placeholder="每行一个公众号文章链接，如：&#10;https://mp.weixin.qq.com/s/xxxxx&#10;https://mp.weixin.qq.com/s/yyyyy"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleWechatPreview" :loading="wechatPreviewing">
                <el-icon><View /></el-icon> {{ wechatPreviewing ? '预览中...' : '预览文章' }}
              </el-button>
              <el-button @click="clearWechat">清空</el-button>
            </el-form-item>
          </el-form>

          <div v-if="wechatPreviewData.length > 0" class="preview-section">
            <div class="preview-header">
              <h4>📋 预览结果</h4>
              <el-tag type="info">共 {{ wechatPreviewData.length }} 篇</el-tag>
              <el-tag v-if="wechatDuplicateCount > 0" type="warning">已存在 {{ wechatDuplicateCount }} 篇</el-tag>
            </div>

            <el-table ref="wechatTableRef" :data="wechatPreviewData" border stripe @selection-change="handleWechatSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="title" label="标题" min-width="200">
                <template #default="{ row }">
                  <span :style="{ color: row.isDuplicate ? '#909399' : '#303133' }">{{ row.title }}</span>
                  <el-tag v-if="row.isDuplicate" size="small" type="info" style="margin-left: 8px;">已存在</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="author" label="作者" width="120" />
              <el-table-column label="封面" width="80">
                <template #default="{ row }">
                  <el-image v-if="row.cover" :src="row.cover" style="width: 50px; height: 35px; border-radius: 4px;" fit="cover" />
                  <span v-else style="color: #c0c4cc; font-size: 12px;">无</span>
                </template>
              </el-table-column>
              <el-table-column prop="summary" label="摘要" min-width="150" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.isDuplicate ? 'info' : 'success'">{{ row.isDuplicate ? '已存在' : '待导入' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button size="small" text @click="previewWechatDetail(row)" :disabled="!row.content">预览</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-card class="import-settings" shadow="never">
              <el-form inline>
                <el-form-item label="目标分类">
                  <el-select v-model="wechatCategoryId" placeholder="选择分类" style="width: 150px">
                    <el-option v-for="cat in categories" :key="cat.id" :label="cat.icon + ' ' + cat.name" :value="cat.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="文章类型">
                  <el-radio-group v-model="wechatType">
                    <el-radio :label="1">免费</el-radio>
                    <el-radio :label="2">积分支付</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="自动发布">
                  <el-switch v-model="wechatAutoPublish" />
                  <span style="margin-left: 12px; color: #909399;">{{ wechatAutoPublish ? '直接发布' : '保存为草稿' }}</span>
                </el-form-item>
                <el-form-item>
                  <el-button type="success" @click="handleWechatImport" :loading="wechatImporting" :disabled="wechatSelectedItems.length === 0">
                    导入选中 ({{ wechatSelectedItems.length }})
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <div v-if="wechatImportResult" class="import-result">
            <el-divider />
            <el-result
              :icon="wechatImportResult.fail === 0 && wechatImportResult.skipped === 0 ? 'success' : 'warning'"
              :title="`成功导入 ${wechatImportResult.success} 篇`"
              :sub-title="`跳过 ${wechatImportResult.skipped || 0} 篇，失败 ${wechatImportResult.fail || 0} 篇`"
            />
            <div v-if="wechatImportResult.errors && wechatImportResult.errors.length > 0">
              <el-divider>错误详情</el-divider>
              <el-table :data="wechatImportResult.errors" border stripe>
                <el-table-column prop="title" label="标题" min-width="150" />
                <el-table-column prop="error" label="错误原因" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    
	</el-tabs>
    <!-- ===== 文章预览弹窗 ===== -->
    <el-dialog v-model="detailVisible" title="文章预览" width="70%">
      <div class="detail-content" v-html="detailContent"></div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Edit, Plus, View, Link } from '@element-plus/icons-vue'
import { importAPI, categoryAPI } from '@/api'

// ============================================================
// 基础状态
// ============================================================
const activeTab = ref('csv')
const categories = ref([])
const detailVisible = ref(false)
const detailContent = ref('')

// ============================================================
// CSV 导入
// ============================================================
const csvFileList = ref([])
const csvPreviewData = ref([])
const csvImportData = ref([])
const csvImporting = ref(false)
const csvImportResult = ref(null)

// ============================================================
// RSS 导入
// ============================================================
const rssUrl = ref('')
const rssCategoryId = ref('')
const rssPreviewing = ref(false)
const rssImporting = ref(false)
const rssPreviewData = ref([])
const rssFeedTitle = ref('')
const rssSelectedItems = ref([])
const rssImportType = ref(1)
const rssAutoPublish = ref(false)
const rssImportResult = ref(null)
const rssTableRef = ref()

const rssDuplicateCount = computed(() => {
  return rssPreviewData.value.filter(item => item.isDuplicate).length
})

// ============================================================
// 公众号抓取
// ============================================================
const wechatUrls = ref('')
const wechatCategoryId = ref('')
const wechatType = ref(1)
const wechatAutoPublish = ref(false)
const wechatPreviewing = ref(false)
const wechatImporting = ref(false)
const wechatPreviewData = ref([])
const wechatSelectedItems = ref([])
const wechatImportResult = ref(null)
const wechatTableRef = ref()

const wechatDuplicateCount = computed(() => {
  return wechatPreviewData.value.filter(item => item.isDuplicate).length
})

// ============================================================
// 手动录入
// ============================================================
const manualImporting = ref(false)
const manualResult = ref(null)
const manualForm = reactive({
  title: '',
  subtitle: '',
  category_id: '',
  type: 1,
  points_required: 10,
  summary: '',
  content: '',
  cover: ''
})

// ============================================================
// 加载分类
// ============================================================
const loadCategories = async () => {
  try {
    const data = await categoryAPI.list()
    categories.value = data || []
    if (categories.value.length > 0) {
      manualForm.category_id = categories.value[0].id
      rssCategoryId.value = categories.value[0].id
      wechatCategoryId.value = categories.value[0].id
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

// ============================================================
// 下载 CSV 模板
// ============================================================
const downloadTemplate = () => {
  const headers = ['title', 'subtitle', 'cover', 'summary', 'content', 'category_name', 'type', 'points_required']
  const example = [
    '如何成为产品经理',
    '从0到1的完整路径',
    'https://example.com/cover.jpg',
    '本文详细介绍了产品经理的成长路径',
    '<p>正文内容...</p>',
    '产品设计',
    '免费',
    ''
  ]
  
  const csvContent = headers.join(',') + '\n' + example.join(',')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '文章导入模板.csv'
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('模板下载成功')
}

// ============================================================
// CSV 解析
// ============================================================
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    ElMessage.error('CSV 文件为空或格式不正确')
    return []
  }
  
  const headers = lines[0].split(',').map(h => h.trim())
  const result = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((key, index) => {
      obj[key] = values[index] || ''
    })
    result.push(obj)
  }
  
  return result
}

const handleCsvChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const data = parseCSV(text)
      if (data.length === 0) {
        ElMessage.warning('没有解析到有效数据')
        return
      }
      csvImportData.value = data
      csvPreviewData.value = data.slice(0, 5)
      ElMessage.success(`解析成功，共 ${data.length} 条数据`)
    } catch (err) {
      console.error('解析失败:', err)
      ElMessage.error('文件解析失败，请检查格式')
    }
  }
  reader.readAsText(file.raw)
}

const clearCsvPreview = () => {
  csvPreviewData.value = []
  csvImportData.value = []
  csvImportResult.value = null
  csvFileList.value = []
}

const handleCsvImport = async () => {
  if (!csvImportData.value || csvImportData.value.length === 0) {
    ElMessage.warning('请先上传 CSV 文件')
    return
  }
  
  csvImporting.value = true
  csvImportResult.value = null
  
  try {
    const res = await importAPI.batch(csvImportData.value)
    csvImportResult.value = res.data
    ElMessage.success(`成功导入 ${res.data.success} 篇`)
    if (res.data.fail === 0) {
      setTimeout(() => clearCsvPreview(), 3000)
    }
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  } finally {
    csvImporting.value = false
  }
}

// ============================================================
// RSS 预览与导入
// ============================================================
const handleRssPreview = async () => {
  if (!rssUrl.value.trim()) {
    ElMessage.warning('请输入 RSS 地址')
    return
  }
  
  rssPreviewing.value = true
  rssPreviewData.value = []
  rssImportResult.value = null
  
  try {
    const res = await importAPI.rssPreview(rssUrl.value)
    rssFeedTitle.value = res.data.feedTitle || '未知源'
    rssPreviewData.value = res.data.items || []
    rssSelectedItems.value = []
    rssTableRef.value?.clearSelection()
    ElMessage.success(`加载 ${rssPreviewData.value.length} 篇文章`)
  } catch (err) {
    ElMessage.error(err.message || '预览失败')
  } finally {
    rssPreviewing.value = false
  }
}

const handleRssSelectionChange = (rows) => {
  rssSelectedItems.value = rows.filter(row => !row.isDuplicate)
}

const previewRssDetail = (row) => {
  detailContent.value = row.content || row.summary || '暂无内容'
  detailVisible.value = true
}

const handleRssImportSelected = async () => {
  if (rssSelectedItems.value.length === 0) {
    ElMessage.warning('请选择要导入的文章')
    return
  }
  if (!rssCategoryId.value) {
    ElMessage.warning('请选择目标分类')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要导入 ${rssSelectedItems.value.length} 篇文章吗？`, '确认导入', { type: 'info' })
  } catch {
    return
  }
  
  rssImporting.value = true
  rssImportResult.value = null
  
  try {
    const res = await importAPI.rssImport(rssSelectedItems.value, rssCategoryId.value, rssImportType.value, rssAutoPublish.value)
    rssImportResult.value = res.data
    ElMessage.success(`成功导入 ${res.data.success} 篇`)
    await handleRssPreview()
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  } finally {
    rssImporting.value = false
  }
}

// ============================================================
// 公众号抓取（带预览）
// ============================================================
const handleWechatPreview = async () => {
  if (!wechatUrls.value.trim()) {
    ElMessage.warning('请输入公众号文章链接')
    return
  }
  
  wechatPreviewing.value = true
  wechatPreviewData.value = []
  wechatImportResult.value = null
  
  try {
    const urls = wechatUrls.value.split('\n').filter(u => u.trim())
    const res = await importAPI.wechatPreview(urls)
    wechatPreviewData.value = res.data.items || []
    wechatSelectedItems.value = []
    wechatTableRef.value?.clearSelection()
    ElMessage.success(`加载 ${wechatPreviewData.value.length} 篇文章`)
  } catch (err) {
    ElMessage.error(err.message || '预览失败')
  } finally {
    wechatPreviewing.value = false
  }
}

const handleWechatSelectionChange = (rows) => {
  wechatSelectedItems.value = rows.filter(row => !row.isDuplicate)
}

const previewWechatDetail = (row) => {
  if (!row.content) {
    ElMessage.warning('该文章没有内容')
    return
  }
  detailContent.value = row.content
  detailVisible.value = true
}

const handleWechatImport = async () => {
  if (wechatSelectedItems.value.length === 0) {
    ElMessage.warning('请选择要导入的文章（已存在的不可选）')
    return
  }
  if (!wechatCategoryId.value) {
    ElMessage.warning('请选择目标分类')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要导入 ${wechatSelectedItems.value.length} 篇文章吗？`, '确认导入', { type: 'info' })
  } catch {
    return
  }
  
  wechatImporting.value = true
  wechatImportResult.value = null
  
  try {
    const res = await importAPI.wechatImport(wechatSelectedItems.value, wechatCategoryId.value, wechatType.value, wechatAutoPublish.value)
    wechatImportResult.value = res.data
    ElMessage.success(`成功导入 ${res.data.success} 篇`)
    await handleWechatPreview()
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  } finally {
    wechatImporting.value = false
  }
}

const clearWechat = () => {
  wechatUrls.value = ''
  wechatPreviewData.value = []
  wechatSelectedItems.value = []
  wechatImportResult.value = null
}

// ============================================================
// 手动录入
// ============================================================
const resetManualForm = () => {
  manualForm.title = ''
  manualForm.subtitle = ''
  manualForm.summary = ''
  manualForm.content = ''
  manualForm.cover = ''
  manualForm.type = 1
  manualForm.points_required = 10
  manualResult.value = null
}

const handleManualImport = async () => {
  if (!manualForm.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!manualForm.category_id) {
    ElMessage.warning('请选择分类')
    return
  }
  if (!manualForm.content.trim()) {
    ElMessage.warning('请输入正文内容')
    return
  }
  
  manualImporting.value = true
  manualResult.value = null
  
  try {
    const res = await importAPI.batch([{
      title: manualForm.title.trim(),
      subtitle: manualForm.subtitle.trim(),
      cover: manualForm.cover.trim(),
      summary: manualForm.summary.trim(),
      content: manualForm.content,
      category_name: categories.value.find(c => c.id === manualForm.category_id)?.name || '',
      type: manualForm.type === 1 ? '免费' : '积分',
      points_required: manualForm.points_required || 0
    }])
    
    manualResult.value = {
      success: res.data.success > 0,
      message: `✅ 文章「${manualForm.title}」添加成功`
    }
    
    if (res.data.success > 0) {
      ElMessage.success('文章添加成功')
      resetManualForm()
    }
  } catch (err) {
    manualResult.value = {
      success: false,
      message: err.message || '添加失败'
    }
    ElMessage.error(err.message || '添加失败')
  } finally {
    manualImporting.value = false
  }
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

.header-actions {
  display: flex;
  gap: 12px;
}

.main-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.main-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.upload-section {
  margin: 20px 0;
  padding: 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  text-align: center;
}

.preview-section {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  color: #303133;
}

.import-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.import-result {
  margin-top: 20px;
}

.import-settings {
  margin-top: 16px;
  background: #fafafa;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  line-height: 1.8;
  font-size: 14px;
}

.detail-content h1, .detail-content h2, .detail-content h3 {
  margin: 16px 0 8px;
}

.detail-content p {
  margin: 8px 0;
}

.detail-content ul, .detail-content ol {
  padding-left: 24px;
}
</style>