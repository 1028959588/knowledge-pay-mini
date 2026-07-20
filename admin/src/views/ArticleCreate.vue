<template>
  <div class="page-container">
    <!-- ===== 页面头部 ===== -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.back()" size="default">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <span class="page-title">{{ isEdit ? '✏️ 编辑文章' : '📝 发布文章' }}</span>
        <el-tag v-if="isEdit" size="small" type="info">ID: {{ form.id }}</el-tag>
      </div>
      <div>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          <el-icon><Check /></el-icon> {{ isEdit ? '更新文章' : '发布文章' }}
        </el-button>
      </div>
    </div>

    <!-- ===== 表单 ===== -->
    <el-form 
      :model="form" 
      :rules="rules" 
      ref="formRef" 
      label-width="100px" 
      v-loading="loading"
      class="article-form"
    >
      <!-- ===== 基本信息 ===== -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><InfoFilled /></el-icon> 基本信息</span>
            <el-tag size="small" type="info">必填项</el-tag>
          </div>
        </template>
        
        <el-row :gutter="30">
          <el-col :span="16">
            <el-form-item label="标题" prop="title">
              <el-input 
                v-model="form.title" 
                placeholder="请输入文章标题（必填）" 
                maxlength="100" 
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="副标题">
              <el-input 
                v-model="form.subtitle" 
                placeholder="副标题（选填）" 
                maxlength="50"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="30">
          <el-col :span="8">
            <el-form-item label="分类" prop="category_id">
              <el-select 
                v-model="form.category_id" 
                placeholder="请选择分类" 
                style="width: 100%"
                :loading="categoryLoading"
                clearable
              >
                <el-option 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  :label="cat.icon + ' ' + cat.name" 
                  :value="cat.id" 
                />
              </el-select>
              <div v-if="categories.length === 0 && !categoryLoading" class="form-tip">
                ⚠️ 暂无分类，请先在「分类管理」中添加
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容类型" prop="type">
              <el-radio-group v-model="form.type">
                <el-radio :label="1">
                  <el-tag size="small" type="success">🆓 免费</el-tag>
                </el-radio>
                <el-radio :label="2">
                  <el-tag size="small" type="warning">💎 积分支付</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item v-if="form.type === 2" label="所需积分" prop="points_required">
              <el-input-number 
                v-model="form.points_required" 
                :min="1" 
                :max="9999" 
                :step="1"
                controls-position="right"
                style="width: 160px"
              />
              <span class="form-tip">积分</span>
              <span style="margin-left: 12px; color: #909399; font-size: 12px;">
                用户需支付此积分解锁
              </span>
            </el-form-item>
            <div v-else style="color: #c0c4cc; font-size: 14px; padding-top: 8px;">
              <el-icon><InfoFilled /></el-icon> 免费文章无需积分
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- ===== 封面与简介 ===== -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><Picture /></el-icon> 封面与简介</span>
            <el-tag size="small" type="info">选填</el-tag>
          </div>
        </template>
        
        <el-row :gutter="30">
          <el-col :span="6">
            <el-form-item label="封面图">
              <div class="cover-upload">
                <el-upload
                  action="#"
                  list-type="picture-card"
                  :auto-upload="false"
                  :file-list="coverList"
                  :limit="1"
                  :disabled="coverUploading"
                  @change="handleCoverChange"
                  @remove="handleCoverRemove"
                >
                  <el-icon v-if="!coverUploading"><Plus /></el-icon>
                  <span v-else style="font-size: 12px;">上传中...</span>
                </el-upload>
                <div class="cover-tip">
                  <p>建议尺寸 16:9</p>
                  <p>支持 JPG/PNG</p>
                  <p v-if="coverUploading" style="color: #409EFF;">
                    上传中 {{ coverProgress }}%
                  </p>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="18">
            <el-form-item label="简介" prop="summary">
              <el-input 
                v-model="form.summary" 
                type="textarea" 
                :rows="4" 
                placeholder="请输入文章简介（选填，会显示在文章列表）" 
                maxlength="200" 
                show-word-limit
                resize="none"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ===== 正文内容（WangEditor） ===== -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><Document /></el-icon> 正文内容</span>
            <el-tag size="small" type="info">必填</el-tag>
            <el-tag size="small" type="success" style="margin-left: 8px;">
              📋 支持粘贴图片
            </el-tag>
          </div>
        </template>
        
        <el-form-item label="正文" prop="content">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px;">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleEditorCreated"
              style="min-height: 450px;"
            />
          </div>
          <div class="editor-tip">
            <el-icon><InfoFilled /></el-icon>
            💡 支持直接粘贴图片（Ctrl+V / Cmd+V），图片将自动上传到 OSS
          </div>
        </el-form-item>
      </el-card>

      <!-- ===== 发布设置 ===== -->
      <el-card class="form-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><Setting /></el-icon> 发布设置</span>
            <el-tag size="small" type="info">选填</el-tag>
          </div>
        </template>
        
        <el-row :gutter="30">
          <el-col :span="8">
            <el-form-item label="发布时间">
              <el-date-picker
                v-model="form.publish_time"
                type="datetime"
                placeholder="选择发布时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                :default-time="new Date(2000, 1, 1, 8, 0, 0)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">
                  <el-tag size="small" type="success">立即发布</el-tag>
                </el-radio>
                <el-radio :label="0">
                  <el-tag size="small" type="info">存为草稿</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置顶">
              <el-switch 
                v-model="form.is_top" 
                active-color="#6C5CE7"
                inactive-color="#c0c4cc"
              />
              <span class="form-tip">置顶文章将显示在列表最前面</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ===== 底部操作栏 ===== -->
      <div class="form-actions">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 取消
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
          <el-icon><Check /></el-icon> {{ isEdit ? '更新文章' : '发布文章' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, ArrowLeft, Check, InfoFilled, 
  Picture, Document, Setting
} from '@element-plus/icons-vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { articleAPI, categoryAPI } from '@/api'
import { uploadImage } from '@/api/oss'

// ============================================================
// 路由
// ============================================================
const route = useRoute()
const router = useRouter()

// ============================================================
// 响应式数据
// ============================================================
const formRef = ref()
const submitting = ref(false)
const loading = ref(false)
const categoryLoading = ref(false)
const isEdit = ref(!!route.params.id)
const categories = ref([])
const coverList = ref([])
const editorRef = ref(null)

// 封面上传状态
const coverUploading = ref(false)
const coverProgress = ref(0)

// ============================================================
// 表单数据
// ============================================================
const form = reactive({
  id: null,
  title: '',
  subtitle: '',
  cover: '',
  summary: '',
  content: '',
  category_id: '',
  type: 1,
  points_required: 10,
  status: 1,
  is_top: false,
  publish_time: ''
})

// ============================================================
// 表单验证规则
// ============================================================
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入正文内容', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '' || value === '<p><br></p>') {
          callback(new Error('请输入正文内容'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  points_required: [
    { 
      validator: (rule, value, callback) => {
        if (form.type === 2 && (!value || value < 1)) {
          callback(new Error('请输入有效的积分数量'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// ============================================================
// 计算属性
// ============================================================
const hasContent = computed(() => {
  return form.content && form.content.trim() !== '' && form.content !== '<p><br></p>'
})

// ============================================================
// WangEditor 配置
// ============================================================
const toolbarConfig = {
  toolbarKeys: [
    'bold', 'italic', 'underline', 'color', 'bgColor',
    '|', 'fontSize', 'fontFamily',
    '|', 'headerSelect', 'header1', 'header2', 'header3',
    '|', 'bulletedList', 'numberedList', 
    '|', 'insertImage', 'insertVideo', 'insertTable',
    '|', 'codeBlock', 'blockquote',
    '|', 'undo', 'redo'
  ]
}

const editorConfig = {
  placeholder: '请输入文章内容...（支持粘贴图片）',
  MENU_CONF: {
    // 图片上传配置
    uploadImage: {
      // 自定义上传（粘贴图片自动上传到 OSS）
      async customUpload(file, insertFn) {
        console.log('📤 上传图片:', file.name)
        
        try {
          const url = await uploadImage(file, 'articles/')
          console.log('✅ 图片上传成功:', url)
          insertFn(url)
        } catch (err) {
          console.error('❌ 图片上传失败:', err)
          ElMessage.error('图片上传失败，请稍后重试')
        }
      },
      // 允许粘贴图片
      pasteImage: true,
      // 支持多个文件
      multiple: true,
      // 文件大小限制 5MB
      maxFileSize: 5 * 1024 * 1024
    },
    // 视频上传配置
    uploadVideo: {
      async customUpload(file, insertFn) {
        // TODO: 实现视频上传
        ElMessage.warning('视频上传功能开发中')
      }
    }
  }
}

// ============================================================
// 加载分类
// ============================================================
const loadCategories = async () => {
  categoryLoading.value = true
  try {
    const res = await categoryAPI.list()
    categories.value = res || []
    console.log('✅ 分类加载完成，共', categories.value.length, '条')
  } catch (err) {
    console.error('❌ 加载分类失败:', err)
    categories.value = []
  } finally {
    categoryLoading.value = false
  }
}

// ============================================================
// 加载文章（编辑时）
// ============================================================
const loadArticle = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  
  try {
    const res = await articleAPI.detail(route.params.id)
    console.log('📄 文章数据:', res)
    
    const data = res
    form.id = data.id
    form.title = data.title || ''
    form.subtitle = data.subtitle || ''
    form.cover = data.cover || ''
    form.summary = data.summary || ''
    form.content = data.content || ''
    form.category_id = data.category_id || ''
    form.type = data.type || 1
    form.points_required = data.points_required || 10
    form.status = data.status || 1
    form.is_top = data.is_top === 1
    form.publish_time = data.publish_time || ''
    
    if (form.cover) {
      coverList.value = [{ url: form.cover }]
    }
    
  } catch (err) {
    console.error('❌ 加载文章失败:', err)
    ElMessage.error(err.message || '加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// ============================================================
// 编辑器
// ============================================================
const handleEditorCreated = (editor) => {
  editorRef.value = editor
}

// ============================================================
// 封面图处理（上传到 OSS）
// ============================================================
const handleCoverChange = async (file) => {
  try {
    coverUploading.value = true
    coverProgress.value = 0
    
    ElMessage.info('正在上传封面图到 OSS...')
    
    const url = await uploadImage(file.raw, 'articles/')
    console.log('✅ 封面上传成功:', url)
    
    form.cover = url
    coverList.value = [{ url: url }]
    
    coverProgress.value = 100
    ElMessage.success('✅ 封面图上传成功')
    
  } catch (err) {
    console.error('❌ 封面上传失败:', err)
    ElMessage.error(err.message || '封面上传失败，请重试')
    if (form.cover) {
      coverList.value = [{ url: form.cover }]
    } else {
      coverList.value = []
    }
  } finally {
    coverUploading.value = false
    coverProgress.value = 0
  }
}

const handleCoverRemove = () => {
  form.cover = ''
  coverList.value = []
  ElMessage.info('已移除封面')
}

// ============================================================
// 提交
// ============================================================
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (err) {
    return
  }
  
  if (!hasContent.value) {
    ElMessage.warning('请输入正文内容')
    return
  }
  
  const action = isEdit.value ? '更新' : '发布'
  const confirmMsg = isEdit.value 
    ? `确定要更新文章「${form.title}」吗？`
    : `确定要发布文章「${form.title}」吗？`
  
  try {
    await ElMessageBox.confirm(confirmMsg, '确认' + action, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
  } catch {
    return
  }
  
  submitting.value = true
  
  try {
    const submitData = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || '',
      cover: form.cover || '',
      summary: form.summary.trim() || '',
      content: form.content,
      category_id: form.category_id,
      type: form.type,
      points_required: form.points_required || 0,
      status: form.status,
      is_top: form.is_top ? 1 : 0,
      publish_time: form.publish_time || null
    }
    
    console.log('📤 提交数据:', submitData)
    
    if (isEdit.value) {
      await articleAPI.update(form.id, submitData)
      ElMessage.success('✅ 文章更新成功')
    } else {
      await articleAPI.create(submitData)
      ElMessage.success('✅ 文章发布成功')
    }
    
    setTimeout(() => {
      router.push('/articles')
    }, 800)
    
  } catch (err) {
    console.error('❌ 提交失败:', err)
    ElMessage.error(err.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadCategories()
  if (isEdit.value) {
    loadArticle()
  }
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
  padding: 14px 24px;
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

.article-form {
  .form-card {
    margin-bottom: 20px;
    border-radius: 8px;
    
    :deep(.el-card__header) {
      padding: 14px 20px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        span {
          font-weight: 600;
          color: #303133;
          
          .el-icon {
            margin-right: 8px;
            color: $primary;
          }
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 24px 20px;
    }
  }
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.cover-upload {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  
  .cover-tip {
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
    padding-top: 6px;
    
    p {
      margin: 0;
    }
  }
}

.editor-tip {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-icon {
    color: $primary;
  }
}

:deep(.w-e-toolbar) {
  border-bottom: 1px solid #dcdfe6;
}

:deep(.w-e-text-container) {
  min-height: 450px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>