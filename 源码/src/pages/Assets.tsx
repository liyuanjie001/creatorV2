import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  FolderOpen, Folder, FolderPlus, Trash2, Image, FileVideo, FileAudio, FileText,
  Search, SlidersHorizontal, LayoutGrid, List, UploadCloud, Download,
  Play, Check, RotateCcw, X, Star, Pencil, Eye,
  ChevronRight, ChevronDown, FileImage, ArrowLeft,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { assets as seedAssets, deletedAssets as seedDeleted, type Asset } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Topbar from '@/layout/Topbar'

type FolderKey = 'root' | 'favorites'
type TypeFilter = '全部类型' | '图片' | '视频' | '音频' | '文档'
type PageMode = 'library' | 'trash'

const TYPE_FILTERS: TypeFilter[] = ['全部类型', '图片', '视频', '音频', '文档']

const COVER_HUES = [210, 330, 40, 160, 280, 20, 190, 50]

function assetCoverHue(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % COVER_HUES.length
  return COVER_HUES[h]
}

function typeMatches(a: Asset, filter: TypeFilter) {
  if (filter === '全部类型') return true
  if (filter === '文档') return a.type === '文案'
  return a.type === filter
}

function AssetThumb({ a }: { a: Asset }) {
  const hue = assetCoverHue(a.id)
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 55% 42%) 0%, hsl(${(hue + 40) % 360} 45% 28%) 55%, hsl(${(hue + 80) % 360} 40% 18%) 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, white, transparent 45%)' }} />
      {a.type === '视频' && (
        <>
          <span className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-5 w-5 text-white" fill="currentColor" />
          </span>
          {a.duration && (
            <span className="absolute bottom-2 right-2 z-[1] rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/95">
              {a.duration}
            </span>
          )}
        </>
      )}
      {a.type === '图片' && <Image className="relative z-[1] h-8 w-8 text-white/75" />}
      {a.type === '音频' && <FileAudio className="relative z-[1] h-8 w-8 text-white/75" />}
      {a.type === '文案' && <FileText className="relative z-[1] h-8 w-8 text-white/75" />}
    </div>
  )
}

function AssetMeta({ a }: { a: Asset }) {
  return (
    <div className="space-y-0.5 px-2.5 pb-2.5 pt-2">
      <div className="truncate text-[12.5px] font-medium text-slate-800" title={a.name}>{a.name}</div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10.5px] text-slate-400">
        <span>{a.size}</span>
        <span>·</span>
        <span>{a.dimensions}</span>
      </div>
      <div className="text-[10.5px] text-slate-400">上传 {a.updatedAt}</div>
    </div>
  )
}

type AssetOps = {
  onView: (a: Asset) => void
  onDownload: (a: Asset) => void
  onRename: (a: Asset) => void
  onDelete: (a: Asset) => void
}

function AssetCard({
  a, selected, onSelect, ops,
}: {
  a: Asset
  selected: boolean
  onSelect: () => void
  ops: AssetOps
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-white transition-all',
        selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-300 hover:shadow-md',
      )}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => ops.onView(a)}
        title="点击查看"
      >
        <div className="aspect-[4/3] w-full">
          <AssetThumb a={a} />
        </div>
        <AssetMeta a={a} />
      </button>

      <div className="absolute inset-x-0 top-0 aspect-[4/3] pointer-events-none">
        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-auto">
          {[
            { icon: Eye, label: '查看', onClick: () => ops.onView(a) },
            { icon: Download, label: '下载', onClick: () => ops.onDownload(a) },
            { icon: Pencil, label: '重命名', onClick: () => ops.onRename(a) },
            { icon: Trash2, label: '删除', onClick: () => ops.onDelete(a), danger: true },
          ].map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md bg-white/95 shadow-sm',
                danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:text-sky-600',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <button
          type="button"
          title="选择"
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          className={cn(
            'absolute left-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border transition-all pointer-events-auto',
            selected
              ? 'border-sky-500 bg-sky-500 text-white opacity-100'
              : 'border-white/80 bg-black/20 text-transparent opacity-0 group-hover:opacity-100',
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

function AssetTable({
  list, selected, onSelect, ops,
}: {
  list: Asset[]
  selected: Set<string>
  onSelect: (id: string) => void
  ops: AssetOps
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
            <th className="w-10 px-4 py-2.5 font-normal" />
            <th className="px-2 py-2.5 font-normal">文件名</th>
            <th className="w-20 px-2 py-2.5 font-normal">大小</th>
            <th className="w-28 px-2 py-2.5 font-normal">尺寸</th>
            <th className="w-28 px-2 py-2.5 font-normal">上传时间</th>
            <th className="w-40 px-4 py-2.5 text-right font-normal">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr
              key={a.id}
              className="border-b border-slate-50 transition-colors last:border-0 hover:bg-sky-50/40"
            >
              <td className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onSelect(a.id)}
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    selected.has(a.id) ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-white text-transparent',
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>
              </td>
              <td className="max-w-72 px-2 py-2.5">
                <button
                  type="button"
                  onClick={() => ops.onView(a)}
                  className="truncate font-medium text-slate-700 hover:text-sky-600"
                  title="点击查看"
                >
                  {a.name}
                </button>
              </td>
              <td className="px-2 py-2.5 text-slate-500">{a.size}</td>
              <td className="px-2 py-2.5 text-slate-500">{a.dimensions}</td>
              <td className="px-2 py-2.5 text-slate-400">{a.updatedAt}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="inline-flex items-center gap-0.5">
                  <button type="button" onClick={() => ops.onView(a)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600" title="查看">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => ops.onDownload(a)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600" title="下载">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => ops.onRename(a)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600" title="重命名">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => ops.onDelete(a)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="删除">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Assets() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<Asset[]>(() => [...seedAssets])
  const [trash, setTrash] = useState<Asset[]>(() => [...seedDeleted])
  const [mode, setMode] = useState<PageMode>('library')
  const [folder, setFolder] = useState<FolderKey>('root')
  const [rootOpen, setRootOpen] = useState(true)
  const [favOpen, setFavOpen] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('全部类型')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<Asset | null>(null)
  const [renameTarget, setRenameTarget] = useState<Asset | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const rootList = items
  const favoriteList = items.filter((a) => a.favorite)
  const currentList = folder === 'favorites' ? favoriteList : rootList

  const list = useMemo(() => {
    let l = currentList.filter((a) => typeMatches(a, typeFilter))
    if (query.trim()) l = l.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))
    return l
  }, [currentList, typeFilter, query])

  const breadcrumb = mode === 'trash'
    ? '素材库 / 回收站'
    : folder === 'favorites'
      ? '素材库 / 收藏'
      : '素材库'

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const ops: AssetOps = {
    onView: (a) => setPreview(a),
    onDownload: (a) => toast.success(`已开始下载「${a.name}」（演示）`),
    onRename: (a) => {
      setRenameTarget(a)
      setRenameValue(a.name)
    },
    onDelete: (a) => {
      if (!window.confirm(`确定删除「${a.name}」？将移入回收站`)) return
      setItems((prev) => prev.filter((x) => x.id !== a.id))
      setTrash((prev) => [{ ...a, updatedAt: '刚刚' }, ...prev])
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(a.id)
        return next
      })
      if (preview?.id === a.id) setPreview(null)
      toast.success('已移入回收站')
    },
  }

  const confirmRename = () => {
    const next = renameValue.trim()
    if (!renameTarget) return
    if (!next) {
      toast.warning('文件名不能为空')
      return
    }
    setItems((prev) => prev.map((x) => (x.id === renameTarget.id ? { ...x, name: next } : x)))
    if (preview?.id === renameTarget.id) setPreview({ ...renameTarget, name: next })
    setRenameTarget(null)
    toast.success('已重命名')
  }

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return
    const now = new Date()
    const stamp = `今天 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const added: Asset[] = Array.from(files).map((f, i) => {
      const isVideo = f.type.startsWith('video/')
      const isImage = f.type.startsWith('image/')
      const isAudio = f.type.startsWith('audio/')
      return {
        id: `U-${Date.now()}-${i}`,
        name: f.name,
        type: isVideo ? '视频' : isImage ? '图片' : isAudio ? '音频' : '文案',
        size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
        dimensions: isVideo || isImage ? '待识别' : '—',
        updatedAt: stamp,
        project: '未归类',
        day: '今天',
      }
    })
    setItems((prev) => [...added, ...prev])
    setFolder('root')
    setMode('library')
    toast.success(`已上传 ${added.length} 个文件`)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f8fb]">
      <Topbar />

      <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-sky-600"
                title="返回"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">素材库</h1>
            </div>
            <p className="mt-1 pl-8 text-[13px] text-slate-400">统一管理全部素材与收藏</p>
          </div>
          {selected.size > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-sky-50 py-1 pl-3 pr-1.5 text-[12px] text-sky-600">
              已选 {selected.size} 项
              <button type="button" onClick={() => setSelected(new Set())} className="rounded-full p-0.5 hover:bg-sky-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
            <span>{breadcrumb}</span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {searchOpen ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => { if (!query) setSearchOpen(false) }}
                  placeholder="搜索素材…"
                  className="h-8 w-48 border-slate-200 bg-white pl-8 text-[12.5px] placeholder:text-slate-400 focus-visible:ring-sky-300"
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-600 hover:text-slate-900"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-3.5 w-3.5" /> 搜索
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-600 hover:text-slate-900',
                    typeFilter !== '全部类型' && 'border-sky-300 bg-sky-50 text-sky-600',
                  )}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> 筛选
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 border-slate-200 bg-white p-1.5 text-slate-800 shadow-lg">
                <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400">素材类型</div>
                {TYPE_FILTERS.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    className={cn('cursor-pointer gap-2', typeFilter === t && 'bg-sky-50 font-medium text-sky-600')}
                    onClick={() => {
                      setTypeFilter(t)
                      setMode('library')
                    }}
                  >
                    {t}
                    {typeFilter === t && <Check className="ml-auto h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-600 hover:text-slate-900"
              onClick={() => toast.success('已在根目录新建文件夹（演示）')}
            >
              <FolderPlus className="h-3.5 w-3.5" /> 新建文件夹
            </Button>

            <Button
              size="sm"
              className="h-8 gap-1.5 bg-slate-900 px-3 text-[12.5px] text-white hover:bg-slate-800"
              onClick={() => {
                setMode('library')
                setFolder('root')
                fileRef.current?.click()
              }}
            >
              <UploadCloud className="h-3.5 w-3.5" /> 上传文件
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-[12.5px]',
                mode === 'trash' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'text-slate-600 hover:text-slate-900',
              )}
              onClick={() => {
                setMode((m) => (m === 'trash' ? 'library' : 'trash'))
                setSelected(new Set())
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> 回收站
            </Button>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView('grid')}
                title="网格视图"
                className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', view === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                title="列表视图"
                className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', view === 'list' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600')}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.txt,.doc,.docx,.md,.pdf"
          className="hidden"
          onChange={(e) => {
            onUpload(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="flex min-h-0 flex-1 gap-3">
          <aside className="flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex-1 overflow-y-auto p-2 scroll-slim">
              <button
                type="button"
                onClick={() => {
                  setRootOpen((v) => !v)
                  setFolder('root')
                  setMode('library')
                  setSelected(new Set())
                }}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium transition-colors',
                  folder === 'root' && mode === 'library' ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {rootOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                <Folder className="h-3.5 w-3.5 text-amber-500" />
                全部素材
                <span className="ml-auto text-[11px] font-normal text-slate-300">{rootList.length}</span>
              </button>
              {rootOpen && (
                <div className="mb-1 ml-3 space-y-0.5 border-l border-slate-100 pl-2">
                  {rootList.slice(0, 8).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setFolder('root')
                        setMode('library')
                        setSelected(new Set([a.id]))
                        ops.onView(a)
                      }}
                      className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      title={a.name}
                    >
                      <FileImage className="h-3 w-3 shrink-0 text-slate-300" />
                      <span className="truncate">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setFavOpen((v) => !v)
                  setFolder('favorites')
                  setMode('library')
                  setSelected(new Set())
                }}
                className={cn(
                  'mt-0.5 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium transition-colors',
                  folder === 'favorites' && mode === 'library' ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {favOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                收藏
                <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-400">系统</span>
              </button>
              {favOpen && (
                <div className="ml-3 space-y-0.5 border-l border-slate-100 pl-2">
                  {favoriteList.length > 0 ? (
                    favoriteList.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setFolder('favorites')
                          setMode('library')
                          setSelected(new Set([a.id]))
                          ops.onView(a)
                        }}
                        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        title={a.name}
                      >
                        <FileImage className="h-3 w-3 shrink-0 text-slate-300" />
                        <span className="truncate">{a.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-1.5 py-1 text-[11px] text-slate-300">暂无收藏</p>
                  )}
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 scroll-slim">
            {mode === 'trash' ? (
              <div className="space-y-2">
                <p className="mb-3 text-[12.5px] text-slate-400">回收站中的素材将在 30 天后自动彻底清除</p>
                {trash.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-100">
                      {a.type === '图片' ? <Image className="h-4 w-4" /> : a.type === '音频' ? <FileAudio className="h-4 w-4" /> : a.type === '视频' ? <FileVideo className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-slate-700">{a.name}</div>
                      <div className="text-[11.5px] text-slate-400">{a.size} · {a.dimensions} · 删除于 {a.updatedAt}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900"
                      onClick={() => {
                        setTrash((prev) => prev.filter((x) => x.id !== a.id))
                        setItems((prev) => [a, ...prev])
                        toast.success('已恢复')
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> 恢复
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-rose-200 text-[12px] text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => {
                        setTrash((prev) => prev.filter((x) => x.id !== a.id))
                        toast.error('已彻底删除')
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 彻底删除
                    </Button>
                  </div>
                ))}
                {trash.length === 0 && <p className="py-16 text-center text-[13px] text-slate-400">回收站为空</p>}
              </div>
            ) : view === 'grid' ? (
              list.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {list.map((a) => (
                    <AssetCard key={a.id} a={a} selected={selected.has(a.id)} onSelect={() => toggleSelect(a.id)} ops={ops} />
                  ))}
                </div>
              ) : (
                <p className="py-20 text-center text-[13px] text-slate-400">没有符合条件的素材</p>
              )
            ) : list.length > 0 ? (
              <AssetTable list={list} selected={selected} onSelect={toggleSelect} ops={ops} />
            ) : (
              <p className="py-20 text-center text-[13px] text-slate-400">没有符合条件的素材</p>
            )}
          </main>
        </div>
      </div>

      {/* 查看 */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null) }}>
        <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 sm:max-w-2xl">
          {preview && (
            <>
              <div className="relative aspect-video w-full bg-slate-900">
                <AssetThumb a={preview} />
              </div>
              <div className="space-y-3 p-5">
                <DialogHeader>
                  <DialogTitle className="text-[16px] text-slate-800">{preview.name}</DialogTitle>
                  <DialogDescription className="text-[12.5px] text-slate-500">
                    大小 {preview.size} · 尺寸 {preview.dimensions} · 上传 {preview.updatedAt}
                    {preview.duration ? ` · 时长 ${preview.duration}` : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" className="border-slate-200 gap-1.5" onClick={() => ops.onDownload(preview)}>
                    <Download className="h-3.5 w-3.5" /> 下载
                  </Button>
                  <Button variant="outline" className="border-slate-200 gap-1.5" onClick={() => ops.onRename(preview)}>
                    <Pencil className="h-3.5 w-3.5" /> 重命名
                  </Button>
                  <Button
                    variant="outline"
                    className="border-rose-200 gap-1.5 text-rose-500 hover:bg-rose-50"
                    onClick={() => ops.onDelete(preview)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 删除
                  </Button>
                  <Button className="brand-gradient text-white hover:opacity-90" onClick={() => setPreview(null)}>
                    关闭
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 重命名 */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) setRenameTarget(null) }}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] text-slate-800">重命名</DialogTitle>
            <DialogDescription className="text-[12.5px]">修改素材文件名</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmRename() }}
            className="mt-2 border-slate-200 text-[13px] focus-visible:ring-sky-300"
            autoFocus
          />
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" className="border-slate-200" onClick={() => setRenameTarget(null)}>取消</Button>
            <Button className="brand-gradient text-white hover:opacity-90" onClick={confirmRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
