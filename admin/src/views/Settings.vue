<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">⚙️ 系统设置</span>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- ============================================================ -->
      <!-- Tab 1: 积分设置 -->
      <!-- ============================================================ -->
      <el-tab-pane label="💎 积分设置" name="points">
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Coin /></el-icon> 积分规则配置</span>
              <el-tag size="small" type="info">修改后立即生效</el-tag>
            </div>
          </template>

          <el-form :model="pointsSettings" label-width="160px">
            <el-form-item label="积分汇率">
              <el-input-number 
                v-model="pointsSettings.exchange_rate" 
                :min="1" 
                :max="100" 
                :step="1"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">
                1 元 = {{ pointsSettings.exchange_rate }} 积分
              </span>
            </el-form-item>

            <el-form-item label="新用户注册赠送积分">
              <el-input-number 
                v-model="pointsSettings.register_bonus" 
                :min="0" 
                :max="1000" 
                :step="10"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">积分</span>
            </el-form-item>

            <el-form-item label="积分消耗上限">
              <el-input-number 
                v-model="pointsSettings.max_consume" 
                :min="0" 
                :max="99999" 
                :step="100"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">积分（0 表示无限制）</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSettings('points')" :loading="saving">
                💾 保存积分设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ============================================================ -->
      <!-- Tab 2: Banner 管理 -->
      <!-- ============================================================ -->
      <el-tab-pane label="🖼️ Banner 管理" name="banner">
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Picture /></el-icon> 首页轮播图管理</span>
              <el-button type="primary" size="small" @click="openBannerDialog()">
                <el-icon><Plus /></el-icon> 添加 Banner
              </el-button>
            </div>
          </template>

          <el-table :data="bannerList" style="width: 100%" v-loading="bannerLoading" stripe border>
            <el-table-column prop="id" label="ID" width="60" align="center" />
            
            <el-table-column prop="image" label="图片" width="160" align="center">
              <template #default="{ row }">
                <el-image 
                  :src="row.image" 
                  style="width: 120px; height: 60px; border-radius: 6px;" 
                  fit="cover"
                  :preview-src-list="[row.image]"
                />
              </template>
            </el-table-column>
            
            <el-table-column prop="link" label="跳转链接" min-width="200">
              <template #default="{ row }">
                <span style="color: #409EFF; cursor: pointer;" @click="openLink(row.link)">
                  {{ row.link || '无链接' }}
                </span>
              </template>
            </el-table-column>
            
            <el-table-column prop="sort_order" label="排序" width="80" align="center" />
            
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '✅ 显示' : '⛔ 隐藏' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="220" align="center">
              <template #default="{ row }">
                <el-button-group>
                  <el-button size="small" type="primary" plain @click="openBannerDialog(row)">
                    编辑
                  </el-button>
                  <el-button 
                    size="small" 
                    :type="row.status === 1 ? 'warning' : 'success'" 
                    plain
                    @click="toggleBannerStatus(row)"
                  >
                    {{ row.status === 1 ? '隐藏' : '显示' }}
                  </el-button>
                  <el-button size="small" type="danger" plain @click="deleteBanner(row)">
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="bannerList.length === 0 && !bannerLoading" class="empty-state">
            <el-empty description="暂无 Banner，点击「添加 Banner」创建" />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ============================================================ -->
      <!-- Tab 3: 广告配置 -->
      <!-- ============================================================ -->
      <el-tab-pane label="📺 广告配置" name="ad">
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><VideoCamera /></el-icon> 激励视频广告配置</span>
              <el-tag size="small" type="info">修改后立即生效</el-tag>
            </div>
          </template>

          <el-form :model="adSettings" label-width="160px">
            <el-form-item label="广告总开关">
              <el-switch 
                v-model="adSettings.enabled" 
                active-color="#67C23A"
                inactive-color="#F56C6C"
                active-text="开启"
                inactive-text="关闭"
              />
              <span style="margin-left: 12px; color: #909399;">
                {{ adSettings.enabled ? '用户可以看到广告入口' : '广告入口全部隐藏' }}
              </span>
            </el-form-item>

            <el-form-item label="每日观看上限">
              <el-input-number 
                v-model="adSettings.daily_limit" 
                :min="1" 
                :max="100" 
                :step="1"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">次 / 天</span>
            </el-form-item>

            <el-form-item label="单次观看奖励">
              <el-input-number 
                v-model="adSettings.reward_points" 
                :min="1" 
                :max="100" 
                :step="1"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">积分 / 次</span>
            </el-form-item>

            <el-form-item label="观看冷却时间">
              <el-input-number 
                v-model="adSettings.cooldown" 
                :min="5" 
                :max="120" 
                :step="5"
                controls-position="right"
              />
              <span style="margin-left: 12px; color: #909399;">秒</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSettings('ad')" :loading="saving">
                💾 保存广告配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ============================================================ -->
      <!-- Tab 4: 系统信息 -->
      <!-- ============================================================ -->
      <el-tab-pane label="ℹ️ 系统信息" name="info">
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><InfoFilled /></el-icon> 系统状态</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="系统名称">知识付费系统</el-descriptions-item>
            <el-descriptions-item label="版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="后端状态">
              <el-tag type="success" size="small">✅ 运行中</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数据库状态">
              <el-tag type="success" size="small">✅ 已连接</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="OSS 状态">
              <el-tag :type="ossStatus ? 'success' : 'danger'" size="small">
                {{ ossStatus ? '✅ 已配置' : '❌ 未配置' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="总文章数">
              <span style="font-weight: 600; color: #303133;">{{ systemInfo.totalArticles || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总用户数">
              <span style="font-weight: 600; color: #303133;">{{ systemInfo.totalUsers || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总积分消耗">
              <span style="font-weight: 600; color: #303133;">{{ systemInfo.totalPointsCost || 0 }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px;">
            <el-button @click="refreshSystemInfo" :loading="infoLoading">
              🔄 刷新系统信息
            </el-button>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ============================================================ -->
    <!-- Banner 弹窗 -->
    <!-- ============================================================ -->
    <el-dialog 
      v-model="bannerDialogVisible" 
      :title="bannerDialogTitle" 
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="bannerForm" :rules="bannerRules" ref="bannerFormRef" label-width="100px">
        <el-form-item label="图片地址" prop="image">
          <el-input v-model="bannerForm.image" placeholder="请输入图片 URL" />
          <div style="margin-top: 8px;">
            <el-image 
              v-if="bannerForm.image" 
              :src="bannerForm.image" 
              style="width: 200px; height: 100px; border-radius: 6px;" 
              fit="cover"
            />
          </div>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            💡 建议使用 OSS 图片地址，尺寸 750x375
          </div>
        </el-form-item>

        <el-form-item label="跳转链接">
          <el-input v-model="bannerForm.link" placeholder="点击 Banner 跳转的 URL（选填）" />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            💡 支持小程序页面路径，如：/pages/index/index
          </div>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number 
            v-model="bannerForm.sort_order" 
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
            v-model="bannerForm.status" 
            :active-value="1" 
            :inactive-value="0"
            active-color="#67C23A"
            inactive-color="#F56C6C"
            active-text="显示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bannerSaving" @click="submitBanner">
          {{ isBannerEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Coin, Picture, Plus, VideoCamera, InfoFilled 
} from '@element-plus/icons-vue'
import { settingsAPI, bannerAPI } from '@/api'

// ============================================================
// 状态
// ============================================================
const activeTab = ref('points')
const saving = ref(false)
const infoLoading = ref(false)
const bannerLoading = ref(false)
const bannerSaving = ref(false)
const bannerDialogVisible = ref(false)
const bannerDialogTitle = ref('添加 Banner')
const isBannerEdit = ref(false)
const bannerFormRef = ref()

// ============================================================
// 积分设置
// ============================================================
const pointsSettings = reactive({
  exchange_rate: 10,
  register_bonus: 100,
  max_consume: 0
})

// ============================================================
// 广告设置
// ============================================================
const adSettings = reactive({
  enabled: true,
  daily_limit: 10,
  reward_points: 5,
  cooldown: 30
})

// ============================================================
// Banner 列表
// ============================================================
const bannerList = ref([])

const bannerForm = reactive({
  id: null,
  image: '',
  link: '',
  sort_order: 0,
  status: 1
})

const bannerRules = {
  image: [{ required: true, message: '请输入图片地址', trigger: 'blur' }]
}

// ============================================================
// 系统信息
// ============================================================
const ossStatus = ref(false)
const systemInfo = reactive({
  totalArticles: 0,
  totalUsers: 0,
  totalPointsCost: 0
})

// ============================================================
// 加载设置
// ============================================================
const loadSettings = async () => {
  try {
    const data = await settingsAPI.get()
    console.log('📋 系统设置:', data)
    
    // 积分设置
    if (data.exchange_rate !== undefined) pointsSettings.exchange_rate = Number(data.exchange_rate)
    if (data.register_bonus !== undefined) pointsSettings.register_bonus = Number(data.register_bonus)
    if (data.max_consume !== undefined) pointsSettings.max_consume = Number(data.max_consume)
    
    // 广告设置
    if (data.ad_enabled !== undefined) adSettings.enabled = data.ad_enabled === 'true'
    if (data.ad_daily_limit !== undefined) adSettings.daily_limit = Number(data.ad_daily_limit)
    if (data.ad_reward_points !== undefined) adSettings.reward_points = Number(data.ad_reward_points)
    if (data.ad_cooldown !== undefined) adSettings.cooldown = Number(data.ad_cooldown)
    
    // OSS 状态
    ossStatus.value = !!data.oss_configured
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

// ============================================================
// 保存设置
// ============================================================
const saveSettings = async (type) => {
  saving.value = true
  
  try {
    let data = {}
    
    if (type === 'points') {
      data = {
        exchange_rate: pointsSettings.exchange_rate,
        register_bonus: pointsSettings.register_bonus,
        max_consume: pointsSettings.max_consume
      }
    } else if (type === 'ad') {
      data = {
        ad_enabled: String(adSettings.enabled),
        ad_daily_limit: adSettings.daily_limit,
        ad_reward_points: adSettings.reward_points,
        ad_cooldown: adSettings.cooldown
      }
    }
    
    await settingsAPI.update(data)
    ElMessage.success('✅ 设置保存成功')
  } catch (err) {
    console.error('保存设置失败:', err)
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ============================================================
// Banner 管理
// ============================================================
const loadBanners = async () => {
  bannerLoading.value = true
  
  try {
    const data = await bannerAPI.list()
    bannerList.value = data || []
    console.log('🖼️ Banner 列表:', bannerList.value.length, '条')
  } catch (err) {
    console.error('加载 Banner 失败:', err)
  } finally {
    bannerLoading.value = false
  }
}

const openBannerDialog = (row) => {
  if (row) {
    isBannerEdit.value = true
    bannerDialogTitle.value = '✏️ 编辑 Banner'
    Object.assign(bannerForm, {
      id: row.id,
      image: row.image || '',
      link: row.link || '',
      sort_order: row.sort_order || 0,
      status: row.status !== undefined ? row.status : 1
    })
  } else {
    isBannerEdit.value = false
    bannerDialogTitle.value = '➕ 添加 Banner'
    Object.assign(bannerForm, {
      id: null,
      image: '',
      link: '',
      sort_order: 0,
      status: 1
    })
  }
  
  bannerDialogVisible.value = true
}

const submitBanner = async () => {
  await bannerFormRef.value.validate()
  
  bannerSaving.value = true
  
  try {
    const data = {
      image: bannerForm.image.trim(),
      link: bannerForm.link.trim() || '',
      sort_order: bannerForm.sort_order || 0,
      status: bannerForm.status
    }
    
    if (isBannerEdit.value) {
      await bannerAPI.update(bannerForm.id, data)
      ElMessage.success('✅ Banner 更新成功')
    } else {
      await bannerAPI.create(data)
      ElMessage.success('✅ Banner 添加成功')
    }
    
    bannerDialogVisible.value = false
    loadBanners()
  } catch (err) {
    console.error('操作失败:', err)
    ElMessage.error(err.message || '操作失败')
  } finally {
    bannerSaving.value = false
  }
}

const toggleBannerStatus = (row) => {
  const action = row.status === 1 ? '隐藏' : '显示'
  const newStatus = row.status === 1 ? 0 : 1
  
  ElMessageBox.confirm(
    `确定要${action}这个 Banner 吗？`,
    '操作确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await bannerAPI.update(row.id, { ...row, status: newStatus })
      ElMessage.success(`✅ ${action}成功`)
      loadBanners()
    } catch (err) {
      ElMessage.error(err.message || '操作失败')
    }
  }).catch(() => {})
}

const deleteBanner = (row) => {
  ElMessageBox.confirm(
    `确定要删除这个 Banner 吗？`,
    '⚠️ 警告',
    { type: 'error' }
  ).then(async () => {
    try {
      await bannerAPI.delete(row.id)
      ElMessage.success('✅ 删除成功')
      loadBanners()
    } catch (err) {
      ElMessage.error(err.message || '删除失败')
    }
  }).catch(() => {})
}

const openLink = (link) => {
  if (link) {
    window.open(link, '_blank')
  }
}

// ============================================================
// 系统信息
// ============================================================
const refreshSystemInfo = async () => {
  infoLoading.value = true
  
  try {
    const data = await settingsAPI.stats()
    systemInfo.totalArticles = data.totalArticles || 0
    systemInfo.totalUsers = data.totalUsers || 0
    systemInfo.totalPointsCost = data.totalPointsCost || 0
    ElMessage.success('✅ 系统信息已刷新')
  } catch (err) {
    console.error('获取系统信息失败:', err)
  } finally {
    infoLoading.value = false
  }
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  loadSettings()
  loadBanners()
  refreshSystemInfo()
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

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.settings-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
  
  :deep(.el-tabs__content) {
    padding-bottom: 20px;
  }
}

.settings-card {
  border-radius: 8px;
  
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

.empty-state {
  padding: 40px 0;
}
</style>