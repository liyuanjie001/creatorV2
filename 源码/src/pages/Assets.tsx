import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  FolderOpen, Folder, Star, Shapes, Trash2, Image, FileVideo, FileAudio, FileText,
  Wand2, Search, SlidersHorizontal, LayoutGrid, List, UploadCloud, Heart, Download,
  Copy, Maximize2, MoreHorizontal, Play, Check, RotateCcw, X, AtSign, Clapperboard,
  User, MapPin, Box, LayoutTemplate, Mic, Orbit, ArrowLeft, Plus, Layers,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assets, projects, assetElements, deletedAssets, type Asset, type AssetElement } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Topbar from '@/layout/Topbar'

/* ---------------- 左侧导航 ---------------- */

type NavKey = 'all' | 'project' | 'favorite' | 'element' | 'trash' | Asset['type'] | 'enhanced'

const libraryNav: { key: NavKey; label: string; icon: typeof FolderOpen; count: number }[] = [
  { key: 'all', label: '素材', icon: FolderOpen, count: assets.length },
  { key: 'project', label: '项目', icon: Folder, count: projects.length },
  { key: 'favorite', label: '收藏', icon: Star, count: assets.filter((a) => a.favorite).length },
  { key: 'element', label: '元素', icon: Shapes, count: assetElements.length },
  { key: 'trash', label: '回收站', icon: Trash2, count: deletedAssets.length },
]

const toolNav: { key: NavKey; label: string; icon: typeof Image; count: number }[] = [
  { key: '图片', label: '图片', icon: Image, count: assets.filter((a) => a.type === '图片').length },
  { key: '视频', label: '视频', icon: FileVideo, count: assets.filter((a) => a.type === '视频').length },
  { key: '音频', label: '音频', icon: FileAudio, count: assets.filter((a) => a.type === '音频').length },
  { key: '文案', label: '文案', icon: FileText, count: assets.filter((a) => a.type === '文案').length },
  { key: 'enhanced', label: '已增强', icon: Wand2, count: assets.filter((a) => a.enhanced).length },
]

const navTitles: Record<NavKey, string> = {
  all: '素材', project: '项目', favorite: '收藏', element: '元素', trash: '回收站',
  图片: '图片', 视频: '视频', 音频: '音频', 文案: '文案', enhanced: '已增强',
}

/* ---------------- 素材卡片 ---------------- */

function AssetThumb({ a }: { a: Asset }) {
  return (
    <div className="thumb-gradient relative flex h-full w-full items-center justify-center">
      <div className="absolute -right-3 -top-4 h-16 w-16 rounded-full bg-sky-100 blur-xl" />
      {a.type === '视频' && (
        <>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="h-4 w-4 text-white" fill="currentColor" />
          </span>
          {a.duration && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">{a.duration}</span>}
        </>
      )}
      {a.type !== '视频' && (
        <span className="text-white/70">
          {a.type === '图片' ? <Image className="h-6 w-6" /> : a.type === '音频' ? <FileAudio className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
        </span>
      )}
      {a.enhanced && (
        <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-sky-500/90 px-1.5 py-0.5 text-[9.5px] font-medium text-white">
          <Wand2 className="h-2.5 w-2.5" /> 已增强
        </span>
      )}
    </div>
  )
}

function AssetCard({ a, selected, onSelect }: { a: Asset; selected: boolean; onSelect: () => void }) {
  const [fav, setFav] = useState(!!a.favorite)
  return (
    <div
      className={cn(
        'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all',
        selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-transparent hover:border-sky-200'
      )}
      onClick={onSelect}
    >
      <AssetThumb a={a} />

      {/* hover 右侧操作栏 */}
      <div className="absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1">
          {[
            { icon: Heart, label: '收藏', onClick: () => { setFav(!fav); toast.success(fav ? '已取消收藏' : '已收藏') } },
            { icon: Download, label: '下载', onClick: () => toast.success('已开始下载（演示）') },
            { icon: Copy, label: '创建副本', onClick: () => toast.success('已创建副本（演示）') },
            { icon: Maximize2, label: '预览', onClick: () => toast.info('打开预览（演示）') },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              title={label}
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-sky-600"
            >
              <Icon className={cn('h-3.5 w-3.5', label === '收藏' && fav && 'fill-rose-500 text-rose-500')} />
            </button>
          ))}
        </div>
        <button
          title="更多"
          onClick={(e) => { e.stopPropagation(); toast.info('更多操作（演示）') }}
          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-sky-600"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {/* 左下：名称 */}
        <div className="absolute bottom-1.5 left-1.5 right-9 truncate text-[10.5px] text-white/90">{a.name}</div>
      </div>

      {/* 选中勾 */}
      <span
        className={cn(
          'absolute left-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition-all',
          a.enhanced ? 'top-7' : 'top-1.5',
          selected ? 'border-sky-500 bg-sky-500 text-white opacity-100' : 'border-white/80 bg-black/25 text-transparent opacity-0 group-hover:opacity-100'
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </div>
  )
}

/* ---------------- 元素视图 ---------------- */

const elementIcons: Record<AssetElement['kind'], typeof User> = {
  角色: User, 地点: MapPin, 道具: Box, 模板: LayoutTemplate, 配音: Mic,
}

function ElementCard({ e }: { e: AssetElement }) {
  const Icon = elementIcons[e.kind]
  return (
    <div className="glass-card group rounded-xl p-4">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
          <Icon className="h-5 w-5 text-sky-500" />
        </span>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-500">{e.kind}</Badge>
      </div>
      <div className="mt-3 text-[13.5px] font-medium text-slate-800">{e.name}</div>
      <div className="mt-0.5 text-[11.5px] text-slate-400">已被引用 {e.used} 次</div>
      <Button
        size="sm" variant="outline"
        className="mt-3 w-full gap-1.5 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
        onClick={() => toast.success(`生成时将自动 @${e.name}（演示）`)}
      >
        <AtSign className="h-3.5 w-3.5" /> 在生成中引用
      </Button>
    </div>
  )
}

/* ---------------- 主页面 ---------------- */

const dayOrder = ['今天', '昨天', '近7天'] as const

const elementKinds: { key: '全部' | AssetElement['kind']; label: string }[] = [
  { key: '全部', label: '全部' },
  { key: '角色', label: '角色' },
  { key: '地点', label: '地点' },
  { key: '道具', label: '道具' },
  { key: '模板', label: '模板' },
  { key: '配音', label: '配音' },
]

export default function Assets() {
  const navigate = useNavigate()
  const [nav, setNav] = useState<NavKey>('all')
  const [elemKind, setElemKind] = useState<'全部' | AssetElement['kind']>('全部')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const list = useMemo(() => {
    let l = assets
    if (nav === 'favorite') l = l.filter((a) => a.favorite)
    else if (nav === '图片' || nav === '视频' || nav === '音频' || nav === '文案') l = l.filter((a) => a.type === nav)
    else if (nav === 'enhanced') l = l.filter((a) => a.enhanced)
    if (favOnly) l = l.filter((a) => a.favorite)
    if (query.trim()) l = l.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))
    return l
  }, [nav, favOnly, query])

  const sections = useMemo(() => {
    if (nav === 'project') {
      return projects
        .map((p) => ({ key: p.name, dot: p.color, items: list.filter((a) => a.project === p.name) }))
        .filter((s) => s.items.length > 0)
    }
    return dayOrder
      .map((d) => ({ key: d, items: list.filter((a) => a.day === d) }))
      .filter((s) => s.items.length > 0)
  }, [nav, list])

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleSection = (ids: string[]) =>
    setSelected((prev) => {
      const next = new Set(prev)
      const allIn = ids.every((id) => next.has(id))
      ids.forEach((id) => {
        if (allIn) next.delete(id)
        else next.add(id)
      })
      return next
    })

  const showSections = nav !== 'favorite' && nav !== 'element' && nav !== 'trash'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧二级导航（通高，顶栏不占其位置） */}
      <aside className="flex w-48 shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
          <button
            onClick={() => navigate('/')}
            title="返回主页"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-slate-50"
          >
            <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40">
              <Orbit className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-slate-800">出海动力</div>
              <div className="text-[10.5px] text-slate-400">素材库</div>
            </div>
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mx-2.5 mb-1 mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-sky-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 返回
        </button>
        <div className="flex-1 overflow-y-auto scroll-slim px-2.5 py-4">
          <nav className="space-y-0.5">
            {libraryNav.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => { setNav(key); setSelected(new Set()) }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                  nav === key ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-[11px] text-slate-300">{count}</span>
              </button>
            ))}
          </nav>

          <div className="mb-1.5 mt-5 px-2.5 text-[11px] font-medium tracking-wider text-slate-400">工具</div>
          <nav className="space-y-0.5">
            {toolNav.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => { setNav(key); setSelected(new Set()) }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                  nav === key ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-[11px] text-slate-300">{count}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 右侧：顶栏 + 主内容区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex-1 overflow-y-auto scroll-slim">
        <div className="px-6 py-5">
          {/* 头部 */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-800">{navTitles[nav]}</h1>
            {selected.size > 0 && (
              <span className="flex items-center gap-2 rounded-full bg-sky-50 py-1 pl-3 pr-1.5 text-[12px] text-sky-600">
                已选 {selected.size} 项
                <button onClick={() => setSelected(new Set())} className="rounded-full p-0.5 hover:bg-sky-100"><X className="h-3 w-3" /></button>
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索素材…"
                  className="h-9 w-52 border-slate-200 bg-white pl-9 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
                />
              </div>
              <div className="relative">
                <Button
                  variant="outline" size="sm"
                  className={cn('h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900', filterOpen && 'border-sky-300 bg-sky-50 text-sky-600')}
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <SlidersHorizontal className="h-4 w-4" /> 筛选
                </Button>
                {filterOpen && (
                  <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
                    <button
                      onClick={() => setFavOnly(!favOnly)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
                    >
                      <Star className={cn('h-3.5 w-3.5', favOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                      仅看收藏
                      {favOnly && <Check className="ml-auto h-3.5 w-3.5 text-sky-500" />}
                    </button>
                    <button
                      onClick={() => { setNav('enhanced'); setFilterOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-slate-300" /> 仅看已增强
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setView('grid')}
                  title="网格视图"
                  className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-colors', view === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  title="列表视图"
                  className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-colors', view === 'list' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Button size="sm" className="h-9 gap-2 brand-gradient px-4 text-white hover:opacity-90" onClick={() => toast.success('上传功能为演示占位')}>
                <UploadCloud className="h-4 w-4" /> 上传素材
              </Button>
            </div>
          </div>

          {/* 回收站 */}
          {nav === 'trash' && (
            <div className="mt-6 space-y-2">
              <p className="mb-3 text-[12.5px] text-slate-400">回收站中的素材将在 30 天后自动彻底清除</p>
              {deletedAssets.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    {a.type === '图片' ? <Image className="h-4 w-4" /> : a.type === '音频' ? <FileAudio className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-slate-700">{a.name}</div>
                    <div className="text-[11.5px] text-slate-400">{a.type} · {a.size} · 删除于 {a.updatedAt}</div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900" onClick={() => toast.success('已恢复（演示）')}>
                    <RotateCcw className="h-3.5 w-3.5" /> 恢复
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 border-rose-200 text-[12px] text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => toast.error('已彻底删除（演示）')}>
                    <Trash2 className="h-3.5 w-3.5" /> 彻底删除
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 元素 */}
          {nav === 'element' && (() => {
            const filtered = elemKind === '全部' ? assetElements : assetElements.filter((e) => e.kind === elemKind)
            return (
              <>
                {/* 分类页签 + 创建 */}
                <div className="mt-4 flex items-center gap-1.5">
                  {elementKinds.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setElemKind(key)}
                      className={cn(
                        'rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors',
                        elemKind === key ? 'bg-slate-900 font-medium text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <Button
                    size="sm" variant="outline"
                    className="ml-auto gap-1.5 rounded-full border-slate-200 text-[12.5px] text-slate-600 hover:text-sky-600"
                    onClick={() => toast.success('创建元素（演示）：上传图片或描述，AI 提取特征并生成元素')}
                  >
                    <Plus className="h-3.5 w-3.5" /> 创建元素
                  </Button>
                </div>

                {filtered.length > 0 ? (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {filtered.map((e) => <ElementCard key={e.id} e={e} />)}
                  </div>
                ) : (
                  /* 空状态：参考 higgsfield 元素页 */
                  <div className="mt-10 flex flex-col items-center">
                    <div className="text-[15px] font-semibold text-slate-800">暂无元素</div>
                    <p className="mt-1 text-[12.5px] text-slate-400">创建元素，以便在所有项目中保持一致地使用</p>
                    <div className="mt-6 grid w-full max-w-3xl grid-cols-3 gap-3">
                      {[
                        { icon: Shapes, hue: 0, title: '创建元素', desc: '把常用的人物、地点、道具与风格存为元素', thumbs: [User, MapPin, Box] },
                        { icon: AtSign, hue: 40, title: '添加到提示词框', desc: '生成时在输入框 @ 引用，自动补全描述', thumbs: [Mic, FileText, LayoutTemplate] },
                        { icon: Layers, hue: 90, title: '用于保持一致性', desc: '跨项目复用同一角色、声音与视觉风格', thumbs: [User, User, User] },
                      ].map(({ icon: Icon, hue, title, desc, thumbs }) => (
                        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-sky-500" />
                            <span className="text-[13px] font-medium text-slate-800">{title}</span>
                          </div>
                          <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{desc}</p>
                          <div className="mt-3 flex gap-1.5">
                            {thumbs.map((T, i) => (
                              <span key={i} className={cn('thumb-gradient flex h-14 flex-1 items-center justify-center rounded-lg', hue !== 0 && `[filter:hue-rotate(${hue + i * 15}deg)]`)}>
                                <T className="h-4 w-4 text-white/70" />
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="mt-6 gap-2 brand-gradient px-5 text-white hover:opacity-90"
                      onClick={() => toast.success('创建元素（演示）：上传图片或描述，AI 提取特征并生成元素')}
                    >
                      <Plus className="h-4 w-4" /> 创建元素
                    </Button>
                  </div>
                )}
              </>
            )
          })()}

          {/* 收藏（平铺） */}
          {nav === 'favorite' && (
            <div className="mt-5">
              {view === 'grid' ? (
                <div className="grid grid-cols-6 gap-2">
                  {list.map((a) => <AssetCard key={a.id} a={a} selected={selected.has(a.id)} onSelect={() => toggleSelect(a.id)} />)}
                </div>
              ) : (
                <AssetTable list={list} selected={selected} onSelect={toggleSelect} />
              )}
              {list.length === 0 && <p className="py-16 text-center text-[13px] text-slate-400">没有收藏的素材</p>}
            </div>
          )}

          {/* 分组视图（素材 / 类型 / 已增强 / 项目） */}
          {showSections && (
            <div className="mt-5 space-y-7">
              {sections.map((s) => {
                const ids = s.items.map((i) => i.id)
                const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))
                return (
                  <section key={s.key}>
                    <button
                      onClick={() => toggleSection(ids)}
                      className="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-sky-600"
                    >
                      <span className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        allSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-white text-transparent'
                      )}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {'dot' in s && s.dot && <span className="h-3 w-3 rounded-[4px]" style={{ backgroundColor: s.dot }} />}
                      {s.key}
                      <span className="text-[11.5px] font-normal text-slate-400">{s.items.length} 项</span>
                    </button>
                    {view === 'grid' ? (
                      <div className="grid grid-cols-6 gap-2">
                        {s.items.map((a) => <AssetCard key={a.id} a={a} selected={selected.has(a.id)} onSelect={() => toggleSelect(a.id)} />)}
                      </div>
                    ) : (
                      <AssetTable list={s.items} selected={selected} onSelect={toggleSelect} />
                    )}
                  </section>
                )
              })}
              {sections.length === 0 && <p className="py-16 text-center text-[13px] text-slate-400">没有符合条件的素材</p>}
            </div>
          )}

          {/* 底部生成栏 */}
          <div className="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/60 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl brand-gradient">
                <Clapperboard className="h-5 w-5 text-white" />
              </span>
              <div className="relative flex-1">
                <Input
                  placeholder="描述你的需求，基于素材生成新内容，例如：用「数字人艾米」拍一条精华实测短片…"
                  className="h-11 border-slate-200 bg-slate-50 pr-24 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
                />
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[10.5px] text-sky-500">
                  <AtSign className="h-3 w-3" /> 可引用元素
                </span>
              </div>
              <Button className="h-11 gap-2 brand-gradient px-5 text-white hover:opacity-90" onClick={() => toast.success('已加入生成队列（演示）')}>
                <Wand2 className="h-4 w-4" /> 开始生成
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- 列表视图 ---------------- */

function AssetTable({ list, selected, onSelect }: { list: Asset[]; selected: Set<string>; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
            <th className="w-10 px-4 py-2.5 font-normal" />
            <th className="px-2 py-2.5 font-normal">名称</th>
            <th className="w-20 px-2 py-2.5 font-normal">类型</th>
            <th className="w-44 px-2 py-2.5 font-normal">所属项目</th>
            <th className="w-20 px-2 py-2.5 font-normal">大小</th>
            <th className="w-28 px-2 py-2.5 font-normal">更新时间</th>
            <th className="w-24 px-4 py-2.5 text-right font-normal">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-sky-50/40">
              <td className="px-4 py-2.5">
                <button
                  onClick={() => onSelect(a.id)}
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    selected.has(a.id) ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-white text-transparent'
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>
              </td>
              <td className="max-w-72 truncate px-2 py-2.5 font-medium text-slate-700">{a.name}</td>
              <td className="px-2 py-2.5 text-slate-500">{a.type}</td>
              <td className="truncate px-2 py-2.5 text-slate-500">{a.project}</td>
              <td className="px-2 py-2.5 text-slate-500">{a.size}</td>
              <td className="px-2 py-2.5 text-slate-400">{a.updatedAt}</td>
              <td className="px-4 py-2.5 text-right">
                <button onClick={() => toast.success('已开始下载（演示）')} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600" title="下载">
                  <Download className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
