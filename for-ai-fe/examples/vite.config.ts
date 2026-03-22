import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // 代理解决 CORS 问题
    proxy: {
      '/api/proxy': {
        target: '', // 运行时从请求头读取
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 从自定义头获取真实目标
            const target = req.headers['x-target-url'] as string
            if (target) {
              const url = new URL(target)
              proxyReq.setHeader('host', url.host)
            }
          })
        },
      },
    },
  },
})
