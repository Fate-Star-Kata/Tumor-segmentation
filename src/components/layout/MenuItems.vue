<script setup lang="ts">
import type { MenuItem } from '@/types/components/header'
import { inject, ref } from 'vue'

interface Props {
  menuItems: MenuItem[]
}

defineProps<Props>()
// 注入菜单状态管理函数
const isMenuExpanded = inject<(id: string) => boolean>('isMenuExpanded')!
const toggleSubmenu = inject<(id: string) => void>('toggleSubmenu')!

// 定时器管理
const hoverTimers = ref<Map<string, number>>(new Map())

// 鼠标进入处理
const handleMouseEnter = (itemId: string) => {
  // 清除可能存在的收起定时器
  const timer = hoverTimers.value.get(itemId)
  if (timer) {
    clearTimeout(timer)
    hoverTimers.value.delete(itemId)
  }
  // 展开菜单
  if (!isMenuExpanded(itemId)) {
    toggleSubmenu(itemId)
  }
}

// 鼠标离开处理
const handleMouseLeave = (itemId: string) => {
  // 设置延迟收起定时器
  const timer = setTimeout(() => {
    if (isMenuExpanded(itemId)) {
      toggleSubmenu(itemId)
    }
    hoverTimers.value.delete(itemId)
  }, 300)
  hoverTimers.value.set(itemId, timer)
}

// 点击子菜单后收起
const handleChildClick = (parentId: string) => {
  if (isMenuExpanded(parentId)) {
    toggleSubmenu(parentId)
  }
}
</script>

<template>
  <template v-for="item in menuItems" :key="item.id">
    <!-- 无子菜单的项目 -->
    <li v-if="!item.children" v-show="!item.hide">
      <RouterLink :to="item.href as string" class="flex items-center">
        <i v-if="typeof item.icon === 'string'" v-text="item.icon" class="mr-2" />
        <component v-else-if="item.icon !== null" :is="item.icon" class="mr-2" />
        {{ item.label }}
      </RouterLink>
    </li>
    <!-- 有子菜单的项目 -->
    <li v-else v-show="!item.hide" @mouseenter="handleMouseEnter(item.id)" @mouseleave="handleMouseLeave(item.id)">
      <details :open="isMenuExpanded(item.id)">
        <summary class="flex items-center" @click.prevent="toggleSubmenu(item.id)">
          <i v-if="typeof item.icon === 'string'" v-text="item.icon" class="mr-2" />
          <component v-else-if="item.icon !== null" :is="item.icon" class="mr-2" />
          {{ item.label }}
        </summary>
        <Transition name="submenu">
          <ul v-show="isMenuExpanded(item.id)" style="width: max-content; z-index: 999;">
            <template v-for="child in item.children" :key="child.id">
              <!-- 二级菜单无子项 -->
              <li v-if="!child.children" v-show="!child.hide">
                <RouterLink :to="child.href as string" @click="handleChildClick(item.id)">{{ child.label }}</RouterLink>
              </li>
              <!-- 二级菜单有子项 -->
              <li v-else v-show="!child.hide" @mouseenter="handleMouseEnter(child.id)"
                @mouseleave="handleMouseLeave(child.id)">
                <details :open="isMenuExpanded(child.id)">
                  <summary @click.prevent="toggleSubmenu(child.id)">
                    {{ child.label }}
                  </summary>
                  <Transition name="submenu">
                    <ul v-show="isMenuExpanded(child.id)">
                      <li v-for="grandchild in child.children" :key="grandchild.id" v-show="!grandchild.hide">
                        <RouterLink :to="grandchild.href as string" @click="handleChildClick(child.id)">
                          {{ grandchild.label }}
                        </RouterLink>
                      </li>
                    </ul>
                  </Transition>
                </details>
              </li>
            </template>
          </ul>
        </Transition>
      </details>
    </li>
  </template>
</template>

<style scoped>
/* 子菜单展开收起动画 */
details>ul,
details>summary+ul {
  display: block;
  /* 覆盖浏览器默认隐藏 */
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

details:not([open])>ul,
details:not([open])>summary+ul {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

details[open]>ul,
details[open]>summary+ul {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}

/* 取消之前 details 动画规则，避免冲突 */
</style>
