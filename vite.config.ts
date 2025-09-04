import type { UserConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv, mergeConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { devConfig } from './vite.config.dev'
import { prodConfig } from './vite.config.prod'

import autoprefixer from 'autoprefixer';


// 基础配置
const baseConfig: UserConfig = {
  build: {
    rollupOptions: {
      external: ['fsevents'],
      output: {
        // 配置输出目录结构
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'unknown'
          const info = name.split('.')
          let extType = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(name)) {
            extType = 'media'
          } else if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(name)) {
            extType = 'img'
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(name)) {
            extType = 'fonts'
          } else if (/\.(css)(\?.*)?$/i.test(name)) {
            extType = 'css'
          }
          return `${extType}/[name]-[hash][extname]`
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        manualChunks: (id) => {
          // Vue 核心框架
          if (id.includes('vue') && !id.includes('node_modules')) return 'vue-core'
          if (id.includes('node_modules/vue/')) return 'vue'
          if (id.includes('node_modules/vue-router/')) return 'vue-router'
          if (id.includes('node_modules/pinia')) return 'pinia'

          // Element Plus 相关
          if (id.includes('node_modules/element-plus/')) return 'element-plus'
          if (id.includes('node_modules/@element-plus/')) return 'element-plus-icons'

          // 工具库
          if (id.includes('node_modules/axios/')) return 'axios'
          if (id.includes('node_modules/lodash/')) return 'lodash'
          if (id.includes('node_modules/qs/')) return 'qs'
          if (id.includes('node_modules/matter-js/')) return 'matter-js'

          // 图表库
          if (id.includes('node_modules/echarts/')) return 'echarts'
          if (id.includes('node_modules/vue-echarts/')) return 'vue-echarts'

          // 国际化
          if (id.includes('node_modules/vue-i18n/')) return 'vue-i18n'

          // 样式和UI框架
          if (id.includes('node_modules/daisyui/')) return 'daisyui'
          if (id.includes('node_modules/jsrepo/')) return 'jsrepo'

          // 其他工具
          if (id.includes('node_modules/marked/')) return 'marked'

          // 其他第三方库统一打包到vendor
          if (id.includes('node_modules/')) return 'vendor'
        },
      },
    },
  },
  server: {
     proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    // 插件配置将在 defineConfig 中动态设置
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'components': resolve(__dirname, 'src/components'),
      'views': resolve(__dirname, 'src/views'),
      'stores': resolve(__dirname, 'src/stores'),
      'utils': resolve(__dirname, 'src/utils'),
      'assets': resolve(__dirname, 'src/assets'),
      'types': resolve(__dirname, 'src/types'),
      'icon': resolve(__dirname, 'src/components/icon/'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
  },
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 从环境变量获取后端地址
  const backendUrl = env.VITE_SERVER_PATH || 'localhost:8000'

  console.log(backendUrl);

  // 根据环境动态配置插件
  const plugins = [
    VueRouter({
      routesFolder: 'src/pages',
      dts: './typed-router.d.ts',
    }),
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ]

  // 只在开发环境添加 vueDevTools
  if (mode === 'development') {
    plugins.push(vueDevTools() as any)
  }

  const envConfig = {
    ...devConfig,
    plugins,
    server: {
      ...devConfig.server,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },
  }

  if (mode === 'development') {
    // 动态切换配置
    mergeConfig(baseConfig, devConfig)
  }
  else if (mode === 'production') {
    mergeConfig(baseConfig, prodConfig)
  }

  // 合并基础配置和环境配置
  const config = mergeConfig(baseConfig, envConfig)

  // 添加环境变量到 define
  config.define = {
    ...config.define,
    __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || mode),
    __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'Vue App'),
    __BACKEND_URL__: JSON.stringify(backendUrl),
  }

  return config
})
