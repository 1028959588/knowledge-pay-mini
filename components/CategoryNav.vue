<!-- components/CategoryNav.vue -->
<template>
  <view class="category-nav">
    <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
      <view class="category-list">
        <view 
          class="category-item" 
          :class="{ active: currentCategory === 0 }"
          @tap="selectCategory(0)"
        >
          <text class="category-icon">🔥</text>
          <text class="category-name">全部</text>
        </view>
        <view 
          class="category-item" 
          v-for="cat in categories" 
          :key="cat.id"
          :class="{ active: currentCategory === cat.id }"
          @tap="selectCategory(cat.id)"
        >
          <text class="category-icon">{{ cat.icon || '📚' }}</text>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { articleAPI } from '@/utils/api.js'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const currentCategory = ref(props.modelValue)
const categories = ref([])

// 加载分类
const loadCategories = async () => {
  try {
    const res = await articleAPI.categories()
    console.log('分类列表:', res.data)
    categories.value = res.data || []
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const selectCategory = (id) => {
  currentCategory.value = id
  emit('update:modelValue', id)
  emit('change', id)
}

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.category-nav {
  background: #fff;
  padding: 16rpx 0;
  border-radius: 16rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 12rpx;
}

.category-item {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #F5F6FA;
  border-radius: 40rpx;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  .category-icon {
    font-size: 28rpx;
    margin-right: 8rpx;
  }
  
  .category-name {
    font-size: 26rpx;
    color: #636E72;
  }
  
  &.active {
    background: #6C5CE7;
    
    .category-name {
      color: #fff;
    }
  }
}
</style>