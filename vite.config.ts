import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function proxyOptions(target: string, referer: string) {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: any) => {
      proxy.on('proxyReq', (proxyReq: any) => {
        proxyReq.setHeader('Referer', referer)
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
      })
    }
  }
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': '/src' }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/basic': {
        ...proxyOptions('https://basic.10jqka.com.cn', 'https://stockpage.10jqka.com.cn/'),
        rewrite: (path: string) => path.replace(/^\/api\/basic/, '')
      },
      '/api/search': {
        ...proxyOptions('https://news.10jqka.com.cn', 'https://news.10jqka.com.cn/'),
        rewrite: (path: string) => path.replace(/^\/api\/search/, '')
      }
    }
  }
})
