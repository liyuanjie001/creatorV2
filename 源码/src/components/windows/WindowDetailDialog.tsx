import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Modal from '@/components/Modal'
import { PlatformBadge } from '@/components/shared'
import { platforms } from '@/data/mock'
import { useWindowManager } from '@/hooks/useWindowManager'

export default function WindowDetailDialog({
  windowId,
  onWindowIdChange,
  onReport,
}: {
  windowId: string
  onWindowIdChange: (id: string) => void
  onReport: (id: string) => void
}) {
  const manager = useWindowManager()
  const windowItem = manager.windows.find((w) => w.id === windowId)
  const [busy, setBusy] = useState('')

  useEffect(() => {
    setBusy('')
  }, [windowId])

  function recover(accountId: string) {
    setBusy(accountId)
    window.setTimeout(() => {
      manager.synchronize(manager.selectedProjectIds, [accountId])
      setBusy('')
    }, 1200)
  }

  return (
    <Modal open={Boolean(windowItem)} onClose={() => onWindowIdChange('')} className="max-w-2xl">
        <h2 className="pr-6 text-lg font-semibold text-slate-800">{windowItem?.name}</h2>
        <p className="text-[12px] text-slate-400">
          窗口 #{windowItem?.serial} · {windowItem?.region} · {manager.projectForWindow(windowId)?.name}
        </p>
        <div className="rounded-lg bg-sky-50 px-4 py-3 text-[12px] leading-5 text-sky-700">
          每个平台选择一个目标账号。账号身份需要登录检查确认；同一账号可在多个窗口关联，分析时统一去重。
        </div>
        <div className="space-y-2">
          {platforms.map((platform) => {
            const account = manager.windowAccounts(windowId).find((a) => a.platform === platform)
            return (
              <div key={platform} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <PlatformBadge platform={platform} />
                  <span className={`ml-auto text-[11px] ${account?.status === '正常' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {account?.status ?? '未登录'}
                  </span>
                </div>
                {account && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-slate-700">{account.name}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {account.handle} · 平台账号 ID {account.platformAccountId}
                      </p>
                    </div>
                    {account.status === '登录失效' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-200 text-[11px] text-amber-700"
                        disabled={Boolean(busy)}
                        onClick={() => recover(account.id)}
                      >
                        {busy === account.id ? '正在恢复并同步…' : '模拟恢复登录并同步'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <Button
          className="brand-gradient text-white"
          onClick={() => {
            onReport(windowId)
            onWindowIdChange('')
          }}
        >
          查看此窗口数据
        </Button>
    </Modal>
  )
}
