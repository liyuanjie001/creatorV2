import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Modal from '@/components/Modal'
import { Input } from '@/components/ui/input'
import { demoWindows, roxyProjects } from '@/data/windowDemo'
import { synchronizeWindows, useWindowManager } from '@/hooks/useWindowManager'
import { cn } from '@/lib/utils'

const syncStages = ['获取项目窗口', '识别平台登录状态', '汇总视频表现']

export default function RoxyBindingDialog({
  open,
  startAt,
  onOpenChange,
}: {
  open: boolean
  startAt: 'key' | 'projects'
  onOpenChange: (open: boolean) => void
}) {
  const manager = useWindowManager()
  const [stage, setStage] = useState<'key' | 'projects' | 'running' | 'done'>('key')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setApiKey('')
    setError('')
    setStage(startAt)
    setSelected(manager.selectedProjectIds.length ? [...manager.selectedProjectIds] : [])
    setProgress(0)
    // Reset only when the dialog instance mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stage !== 'running') return
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 10))
    }, 220)
    return () => window.clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (stage !== 'running' || progress < 100) return
    synchronizeWindows(selected)
    setStage('done')
  }, [stage, progress, selected])

  const selectedWindowCount = useMemo(
    () => demoWindows.filter((w) => selected.includes(w.roxyProjectId)).length,
    [selected],
  )
  const heading = { key: '绑定 RoxyBrowser', projects: '选择同步项目', running: '正在同步窗口', done: '同步完成' }[stage]

  function connect() {
    if (!apiKey.trim()) {
      setError('请输入 API Key，或使用演示 Key')
      return
    }
    setApiKey('')
    setError('')
    setStage('projects')
  }

  function start() {
    if (!selected.length) {
      setError('至少选择一个项目')
      return
    }
    setError('')
    setProgress(0)
    setStage('running')
  }

  function toggleAll() {
    setSelected(selected.length === roxyProjects.length ? [] : roxyProjects.map((p) => p.id))
  }

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} className="max-w-xl p-7">
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            RoxyBrowser · 演示连接
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-500">
            一个窗口，多平台账号。同步窗口后，统一查看内容表现。
          </p>
        </div>
        <ol className="flex items-center gap-2 text-[11px] text-slate-400" aria-label="绑定步骤">
          <li className={stage === 'key' ? 'text-sky-600' : ''}>01 绑定浏览器</li>
          <li className="h-px flex-1 bg-slate-100" />
          <li className={stage === 'projects' ? 'text-sky-600' : ''}>02 选择项目</li>
          <li className="h-px flex-1 bg-slate-100" />
          <li className={stage === 'running' || stage === 'done' ? 'text-sky-600' : ''}>03 同步完成</li>
        </ol>
        {stage === 'key' && (
          <form
            className="space-y-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault()
              connect()
            }}
          >
            <div className="space-y-2">
              <label htmlFor="roxy-key" className="text-[13px] font-medium text-slate-700">
                本地 RoxyBrowser API Key
              </label>
              <Input
                id="roxy-key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                type="password"
                autoComplete="off"
                placeholder="输入 API Key"
                className="border-slate-200 text-[13px]"
              />
              <p className="text-[12px] text-slate-400">当前为演示模式，使用示例 Key 即可体验，无需启动浏览器。</p>
              <button
                type="button"
                className="text-[12px] font-medium text-sky-600 hover:text-sky-700"
                onClick={() => {
                  setApiKey('roxy-demo-local-key')
                  setError('')
                }}
              >
                一键填入演示 Key
              </button>
            </div>
            {error && (
              <p role="alert" className="text-[12px] text-rose-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" className="brand-gradient text-white">
                同步账号
              </Button>
            </div>
          </form>
        )}
        {stage === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[12px] text-slate-500">
              <span>
                已选 {selected.length} 个项目 · {selectedWindowCount} 个窗口
              </span>
              <button className="text-sky-600" onClick={toggleAll}>
                {selected.length === roxyProjects.length ? '取消全选' : '全选项目'}
              </button>
            </div>
            <div className="max-h-[38vh] space-y-2 overflow-y-auto">
              {roxyProjects.map((project) => (
                <label
                  key={project.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                    selected.includes(project.id)
                      ? 'border-sky-300 bg-sky-50/60'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <input
                    type="checkbox"
                    value={project.id}
                    checked={selected.includes(project.id)}
                    aria-label={project.name}
                    className="h-4 w-4 accent-sky-500"
                    onChange={(event) =>
                      setSelected((ids) =>
                        event.target.checked ? [...ids, project.id] : ids.filter((id) => id !== project.id),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-slate-700">{project.name}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">已关联同名工作台项目</span>
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {demoWindows.filter((w) => w.roxyProjectId === project.id).length} 个窗口
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] leading-5 text-slate-400">
              仅保留本次勾选项目的同步数据。窗口中的账号根据模拟登录状态识别。
            </p>
            {error && (
              <p role="alert" className="text-[12px] text-rose-600">
                {error}
              </p>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setStage('key')}>
                返回绑定
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button className="brand-gradient text-white" onClick={start}>
                  开始同步
                </Button>
              </div>
            </div>
          </div>
        )}
        {stage === 'running' && (
          <div className="space-y-6 py-3" aria-live="polite">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-sky-500" />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {syncStages[Math.min(2, Math.floor(progress / 34))]}
              </span>
              <span className="text-sm tabular-nums text-sky-600">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="同步进度"
            >
              <div className="brand-gradient h-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-3">
              {syncStages.map((name, index) => (
                <div
                  key={name}
                  className={cn('flex items-center gap-2 text-[12px]', progress >= index * 34 ? 'text-slate-600' : 'text-slate-300')}
                >
                  <Check className={cn('h-3.5 w-3.5', progress >= (index + 1) * 33 ? 'text-emerald-500' : 'text-slate-300')} />
                  {name}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              取消同步
            </Button>
          </div>
        )}
        {stage === 'done' && (
          <div className="space-y-5 py-2 text-center" aria-live="polite">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Check className="h-7 w-7" />
            </div>
            <p className="text-sm text-slate-600">窗口和平台账号已同步，可以开始查看内容表现。</p>
            <div className="grid grid-cols-3 rounded-xl bg-slate-50 py-5">
              {[
                { label: '项目', value: manager.selectedProjectIds.length },
                { label: '窗口', value: manager.windows.length },
                { label: '已识别账号', value: manager.accounts.length },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-2xl font-semibold text-slate-800">{item.value}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-slate-400">
              {manager.accounts.filter((a) => a.status === '登录失效').length} 个账号登录失效，可在窗口详情中演示恢复登录。
            </p>
            <Button className="brand-gradient w-full text-white" onClick={() => onOpenChange(false)}>
              进入账号管理
            </Button>
          </div>
        )}
    </Modal>
  )
}
