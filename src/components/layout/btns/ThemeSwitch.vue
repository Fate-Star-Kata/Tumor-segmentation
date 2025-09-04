<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

// 使用主题状态管理
const themeStore = useThemeStore()

// 从状态管理中解构响应式属性
const { currentTheme, themes } = storeToRefs(themeStore)

// 解构方法（方法不需要保持响应性）
const { setTheme, initTheme } = themeStore

// 组件挂载时初始化主题
onMounted(() => {
  initTheme()
})
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- 主题颜色切换下拉菜单 -->
    <div title="Change Theme" class="dropdown dropdown-end block">
      <!-- 触发按钮 -->
      <div tabindex="0" role="button" class="btn group btn-sm gap-1.5 px-1.5 btn-ghost" aria-label="Change Theme">
        <!-- 主题预览色块 -->
        <div
          class="bg-base-100 group-hover:border-base-content/20 border-base-content/10 grid shrink-0 grid-cols-2 gap-0.5 rounded-md border p-1 transition-colors"
        >
          <div class="bg-base-content size-1 rounded-full" />
          <div class="bg-primary size-1 rounded-full" />
          <div class="bg-secondary size-1 rounded-full" />
          <div class="bg-accent size-1 rounded-full" />
        </div>
        <!-- 下拉箭头 -->
        <svg
          width="12px" height="12px" class="mt-px hidden size-2 fill-current opacity-60 sm:inline-block"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
        </svg>
      </div>

      <!-- 下拉菜单内容 -->
      <div
        tabindex="0"
        class="dropdown-content bg-base-200 text-base-content rounded-box top-px h-[30.5rem] max-h-[calc(100vh-8.6rem)] overflow-y-auto border border-white/5 shadow-2xl outline-1 outline-black/5 mt-16"
      >
        <ul class="menu w-56">
          <li class="menu-title text-xs">
            {{ $t('theme.title') }}
          </li>

          <!-- 主题选项列表 -->
          <li v-for="theme in themes" :key="theme.name">
            <button
              class="gap-3 px-2" :class="{ '[&_svg]:visible': currentTheme === theme.name }"
              @click="setTheme(theme.name)"
            >
              <!-- 主题预览色块 -->
              <div class="grid shrink-0 grid-cols-2 gap-0.5 rounded-md p-1 shadow-sm" :style="{ backgroundColor: theme.colors.background }">
                <div class="size-1 rounded-full" :style="{ backgroundColor: theme.colors.neutral }" />
                <div class="size-1 rounded-full" :style="{ backgroundColor: theme.colors.primary }" />
                <div class="size-1 rounded-full" :style="{ backgroundColor: theme.colors.secondary }" />
                <div class="size-1 rounded-full" :style="{ backgroundColor: theme.colors.accent }" />
              </div>

              <!-- 主题名称 -->
              <div class="w-32 truncate">
                {{ theme.displayName }}
              </div>

              <!-- 选中状态图标 -->
              <svg
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                class="invisible h-3 w-3 shrink-0"
              >
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
