import { Outlet, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const location = useLocation()
  // 项目详情 / 素材库：沉浸模式，页面自带侧边栏 + 顶栏（顶栏不占侧边栏位置）
  const immersive = /^\/projects\/(?!new)[^/]+$/.test(location.pathname) || location.pathname === '/assets'

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-slate-900">
      {immersive ? (
        /* 项目详情：沉浸模式，项目页自带侧边栏 + 顶栏（顶栏不占侧边栏位置） */
        <Outlet />
      ) : (
        <>
          <Sidebar />
          <div className="pl-60">
            <Topbar />
            <main className="mx-auto max-w-[1400px] px-6 py-6">
              <Outlet />
            </main>
          </div>
        </>
      )}
      <Toaster theme="light" position="top-center" toastOptions={{ style: { background: '#ffffff', border: '1px solid #e2e9ee', color: '#0f172a' } }} />
    </div>
  )
}
