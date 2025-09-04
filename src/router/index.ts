// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useLoadingStore } from '@/stores/common/loading'

type AutoRoute = {
  path?: string
  name?: string
  component?: any
  children?: AutoRoute[]
  [k: string]: any
}

function normalizePath(p: string) {
  const s = p.replace(/\/+/g, '/').replace(/\/$/, '')
  return s === '' ? '/' : s
}

/**
 * 扁平化并保留组件与子路由：
 * - 如果节点有 component -> 保留该节点（path 为 fullPath），并继续递归处理 children
 * - 如果节点没有 component，但有 children：
 *     - 若存在 index child (path === '') 且该 index 有 component -> 把它当作 fullPath 的组件路由
 *     - 递归处理其他子路由（basePath = fullPath）
 */
function flattenRoutes(list: AutoRoute[], basePath = ''): AutoRoute[] {
  const out: AutoRoute[] = []

  for (const r of list) {
    const seg = r.path ? `${r.path}` : ''
    const fullBase = `${basePath}${seg ? `${seg}/` : ''}`

    if (r.component) {
      out.push({
        ...r,
        path: normalizePath(fullBase)
      })
      if (r.children && r.children.length) {
        out.push(...flattenRoutes(r.children, fullBase))
      }
      continue
    }

    if (r.children && r.children.length) {
      const indexChild = r.children.find(c => c.path === '' && c.component)
      if (indexChild) {
        out.push({
          ...indexChild,
          path: normalizePath(fullBase)
        })
      }
      out.push(...flattenRoutes(r.children.filter(c => c.path !== ''), fullBase))
      continue
    }
  }

  return out
}

function buildRoutes() {
  const normalRoutes = flattenRoutes(
    routes.filter(
      r => r.path !== '/admin' && r.path !== '/templates' && r.path !== '/user'
    )
  )

  // 处理 admin
  const adminRoot = routes.find(r => r.path === '/admin')
  const adminChildren = adminRoot ? flattenRoutes(adminRoot.children || [], '') : []

  // 处理 templates
  const templatesRoot = routes.find(r => r.path === '/templates')
  const templatesChildren = templatesRoot ? flattenRoutes(templatesRoot.children || [], '/templates/') : []

  // 处理 user: 把 /user 下的子路由提到根路径
  const userRoot = routes.find(r => r.path === '/user')
  const userChildren = userRoot ? flattenRoutes(userRoot.children || [], '/') : []

  return [
    ...normalRoutes,
    ...userChildren,
    {
      path: '/admin',
      component: import('@/pages/admin/index.vue'),
      redirect: '/admin/dashboard',
      children: adminChildren
    },
    {
      path: '/templates',
      component: () => import('@/pages/templates/index.vue'),
      children: templatesChildren
    },
    // 404 页面
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('@/pages/404/index.vue')
    },
    // 兜底：所有未匹配的路由跳转到 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    }
  ]
}

const router = createRouter({
  history: createWebHistory(),
  routes: buildRoutes() as RouteRecordRaw[]
})

// 全局导航守卫 - 路由加载动画
router.beforeEach((to, from, next) => {
  if (to.path !== from.path) {
    setTimeout(() => {
      const loadingStore = useLoadingStore()
      loadingStore.showLoading('页面加载中', true)
    }, 0)
  }
  next()
})

router.afterEach((to, from) => {
  if (to.path !== from.path) {
    setTimeout(() => {
      const loadingStore = useLoadingStore()
      loadingStore.hideLoading()
    }, 800)
  }
})

export default router
