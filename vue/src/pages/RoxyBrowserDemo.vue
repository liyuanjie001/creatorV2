<script setup lang="ts">
import {
  Activity,
  Bell,
  Bot,
  Braces,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Globe2,
  Headphones,
  Layers3,
  Mail,
  MapPin,
  Monitor,
  MoreVertical,
  PanelLeft,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const windows = [
  { id: 'L00-10', name: 'B', os: 'Windows', lastOpened: '2026/08/11 14:47:04', project: '窗口转移' },
  {
    id: 'L00-08',
    name: 'FB-2628809010',
    os: 'Windows',
    lastOpened: '2026/08/11 10:29:52',
    project: '默认项目',
  },
  { id: 'L00-04', name: '', os: 'Windows', lastOpened: '--', project: '默认项目' },
  { id: 'L00-03', name: '', os: 'macOS', lastOpened: '2026/06/04 17:56:26', project: '默认项目' },
];

const primaryMenu = [
  { label: '窗口管理', icon: PanelLeft, active: true },
  { label: '项目管理', icon: Layers3 },
  { label: '窗口转移', icon: Activity, indent: true },
  { label: '代理 IP', icon: Globe2, suffix: '🔥 特惠' },
  { label: '平台账号', icon: WalletCards },
  { label: '扩展中心', icon: ShoppingBag },
  { label: '团队管理', icon: UsersRound },
];

const aiMenu = [
  { label: '窗口同步', icon: PanelLeft },
  { label: 'AI Agent', icon: Bot, accent: true, suffix: '自动化' },
  { label: '任务管理', icon: Monitor },
  { label: '模板商城', icon: WalletCards },
  { label: 'API & AI MCP', icon: Braces },
  { label: '充值/账单', icon: CreditCard },
  { label: '推广计划', icon: UsersRound },
];
</script>

<template>
  <main class="roxy-browser-demo text-slate-800">
    <header class="mac-menu-bar" aria-label="macOS 菜单栏">
      <div class="mac-menu-items">
        <span class="mac-menu-brand">Finder</span>
        <span>文件</span>
        <span>编辑</span>
        <span>显示</span>
        <span>前往</span>
        <span>窗口</span>
        <span>帮助</span>
      </div>
      <div class="mac-menu-status" aria-hidden="true">
        <span>●</span>
        <span>◖</span>
        <Search class="size-3.5" />
        <span>9:41</span>
      </div>
    </header>

    <section class="mac-desktop-space" aria-label="macOS 桌面">
      <div class="mac-app-window">
        <div class="mac-window-chrome" aria-hidden="true">
          <span class="mac-window-lights">
            <i />
            <i />
            <i />
          </span>
          <span class="mac-window-title">Roxy浏览器</span>
          <span class="mac-window-spacer" />
        </div>

        <header class="roxy-browser-topbar">
          <RouterLink to="/" class="roxy-brand" aria-label="返回出海内容平台">
            <img src="/favicon.svg" alt="" class="h-8 w-8" />
            <span>Roxy浏览器</span>
          </RouterLink>

          <button
            type="button"
            class="roxy-ad-slot"
            aria-label="查看内容生产与矩阵分发详情"
            @click="router.push('/roxy-website-demo')"
          >
            <span class="roxy-ad-copy">
              <strong>内容生产与矩阵分发</strong>
              <span>联动全球账号与达人，让世界看见你的品牌。</span>
            </span>
            <span class="roxy-ad-button">
              查看详情
              <ExternalLink class="size-3.5" />
            </span>
          </button>

          <div class="roxy-top-actions">
            <button type="button" class="roxy-buy">
              <ShoppingCart class="size-4" />
              购买终身官网
              <span>→</span>
            </button>
            <span class="roxy-divider" />
            <button type="button" class="roxy-location">
              <MapPin class="size-4" />
              <span>US/San Jose (104.249.174.134)</span>
            </button>
            <button type="button" class="roxy-icon-button" aria-label="通知">
              <Bell class="size-4" />
              <span class="roxy-count">2</span>
            </button>
            <button type="button" class="roxy-icon-button" aria-label="消息">
              <Mail class="size-4" />
              <span class="roxy-count">6</span>
            </button>
            <button type="button" class="roxy-icon-button" aria-label="刷新">
              <RefreshCw class="size-4" />
            </button>
            <button type="button" class="roxy-team">
              <span class="roxy-avatar">L0</span>
              <span>LoopyLoopy's Team</span>
              <ChevronDown class="size-3.5" />
            </button>
          </div>
        </header>

        <aside class="roxy-side-nav">
          <button type="button" class="roxy-create-window">
            <CirclePlus class="size-4" />
            创建窗口
          </button>
          <nav aria-label="Roxy 浏览器导航" class="roxy-menu-list">
            <button
              v-for="item in primaryMenu"
              :key="item.label"
              type="button"
              class="roxy-menu-item"
              :class="{ 'is-active': item.active, 'is-indent': item.indent }"
              :aria-current="item.active ? 'page' : undefined"
              @click="item.label === '窗口管理' && router.push('/roxy')"
            >
              <component :is="item.icon" class="size-[18px] shrink-0" />
              <span>{{ item.label }}</span>
              <span v-if="item.suffix" class="roxy-menu-suffix">{{ item.suffix }}</span>
              <span v-if="item.label === '项目管理'" class="ml-auto text-slate-500">−</span>
            </button>
          </nav>

          <div class="roxy-ai-heading">
            <span>AI &amp; 自动化</span>
            <ChevronDown class="size-4" />
          </div>
          <nav aria-label="AI 与自动化" class="roxy-menu-list roxy-ai-list">
            <button v-for="item in aiMenu" :key="item.label" type="button" class="roxy-menu-item">
              <component
                :is="item.icon"
                class="size-[18px] shrink-0"
                :class="item.accent && 'text-fuchsia-500'"
              />
              <span :class="item.accent && 'roxy-ai-accent'">{{ item.label }}</span>
              <span v-if="item.suffix" class="roxy-ai-pill">{{ item.suffix }}</span>
            </button>
          </nav>

          <div class="roxy-side-bottom">
            <div class="roxy-promo-card">
              <span>专为 AI 账号深度优化</span>
              <div class="roxy-promo-icons">
                <span>✺</span>
                <span>◉</span>
                <span>✧</span>
                <span>◈</span>
                <span>◍</span>
              </div>
            </div>
            <div class="roxy-plan-card">
              <span class="roxy-free-pill">免费</span>
              <div class="roxy-usage-bar"><i /></div>
              <div class="roxy-usage-label">
                <strong>窗口用量</strong>
                <span>
                  4 / 5
                  <CircleHelp class="size-3" />
                </span>
              </div>
              <button type="button" class="roxy-upgrade">立即升级</button>
            </div>
          </div>
        </aside>

        <section class="roxy-workspace" aria-label="Roxy 浏览器窗口演示">
          <div class="roxy-workspace-header">
            <nav class="roxy-tabs" aria-label="窗口分类">
              <button class="is-current" type="button">全部窗口</button>
              <button type="button">收藏</button>
              <button type="button">已打开</button>
              <button type="button">操作系统 Android</button>
              <button type="button">转移中</button>
              <button type="button">回收站</button>
            </nav>
            <div class="roxy-toolbar">
              <button type="button" class="roxy-quick-create">
                <CirclePlus class="size-4" />
                快速创建
                <Settings class="ml-1 size-4" />
              </button>
              <label class="roxy-search">
                <Search class="size-4" />
                <input aria-label="搜索窗口" placeholder="搜索 Ctrl + F" />
              </label>
              <button type="button" class="roxy-filter">
                <Filter class="size-4" />
                筛选
              </button>
              <div class="ml-auto flex items-center gap-2">
                <button type="button" class="roxy-ai-action">
                  <Sparkles class="size-4" />
                  AI 自动化
                </button>
                <button type="button" class="roxy-proxy-check">
                  <Globe2 class="size-4" />
                  测试全部代理 IP
                </button>
                <button type="button" class="roxy-icon-button" aria-label="窗口设置">
                  <SlidersHorizontal class="size-4" />
                </button>
                <button type="button" class="roxy-icon-button" aria-label="刷新窗口">
                  <RefreshCw class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="roxy-table-scroll">
            <table class="roxy-window-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="选择全部窗口" /></th>
                  <th>
                    编号
                    <span>↕</span>
                  </th>
                  <th>
                    窗口名称
                    <span>↕</span>
                  </th>
                  <th>操作</th>
                  <th>
                    备注
                    <Eye class="inline size-3.5" />
                  </th>
                  <th>标签</th>
                  <th>项目</th>
                  <th>
                    最后打开
                    <span>↕</span>
                  </th>
                  <th>其他</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in windows" :key="item.id">
                  <td><input type="checkbox" :aria-label="`选择窗口 ${item.id}`" /></td>
                  <td class="font-mono text-[12px]">{{ item.id }}</td>
                  <td>
                    <div class="roxy-window-name">
                      <span class="roxy-os-icon" :class="item.os === 'macOS' && 'is-mac'">
                        {{ item.os === 'macOS' ? 'mac\nOS' : '⊞' }}
                      </span>
                      <span class="roxy-link-dots" />
                      <span class="roxy-platform-icon">◉</span>
                      <span class="roxy-platform-icon is-facebook">f</span>
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td>
                    <button type="button" class="roxy-open-window">
                      <Globe2 class="size-3.5 text-sky-500" />
                      打开窗口
                    </button>
                  </td>
                  <td>
                    <button type="button" class="roxy-note" :aria-label="`窗口 ${item.id} 备注`">▤</button>
                  </td>
                  <td>
                    <button type="button" class="roxy-tag" :aria-label="`窗口 ${item.id} 标签`">
                      <Tag class="size-3.5" />
                    </button>
                  </td>
                  <td>
                    <button type="button" class="roxy-project">
                      <Layers3 class="size-3.5" />
                      {{ item.project }}
                    </button>
                  </td>
                  <td class="whitespace-nowrap text-[12px]">{{ item.lastOpened }}</td>
                  <td>
                    <div class="flex items-center justify-center gap-2">
                      <button type="button" class="roxy-row-more" aria-label="代理状态">◉</button>
                      <button type="button" class="roxy-row-more" :aria-label="`窗口 ${item.id} 更多操作`">
                        <MoreVertical class="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <footer class="roxy-pagination">
            <span>总计 4 个</span>
            <button type="button">
              10 条/页
              <ChevronDown class="size-3" />
            </button>
            <div class="roxy-page-controls">
              <span>跳转页数至</span>
              <input aria-label="跳转页数" value="1" />
              <button type="button" aria-label="上一页">‹</button>
              <button type="button" class="is-page">1</button>
              <button type="button" aria-label="下一页">›</button>
            </div>
          </footer>
        </section>

        <button type="button" class="roxy-support" aria-label="客服支持">
          <Headphones class="size-5" />
        </button>
        <button type="button" class="roxy-demo-back" @click="router.push('/')">
          <X class="size-4" />
          退出演示
        </button>
      </div>
    </section>

    <div class="mac-dock" aria-label="macOS Dock" role="group">
      <span class="mac-dock-icon dock-finder" aria-label="Finder"><PanelLeft class="size-5" /></span>
      <span class="mac-dock-icon dock-roxy" aria-label="Roxy浏览器"><img src="/favicon.svg" alt="" /></span>
      <span class="mac-dock-icon dock-safari" aria-label="Safari"><Globe2 class="size-5" /></span>
      <span class="mac-dock-icon dock-launchpad" aria-label="Launchpad"><Sparkles class="size-5" /></span>
      <span class="mac-dock-icon dock-store" aria-label="App Store"><ShoppingBag class="size-5" /></span>
      <span class="mac-dock-icon dock-settings" aria-label="系统设置"><Settings class="size-5" /></span>
    </div>
  </main>
</template>

<style scoped>
.roxy-browser-demo {
  position: relative;
  display: grid;
  width: 100%;
  height: 100vh;
  min-height: 560px;
  grid-template-rows: 28px minmax(0, 1fr) 50px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 18% 32%, #5ba8d6 0, transparent 31%),
    radial-gradient(ellipse at 75% 24%, #83c1bf 0, transparent 32%),
    radial-gradient(ellipse at 62% 85%, #556fa7 0, transparent 37%),
    linear-gradient(135deg, #25476d, #326b85 48%, #344d78);
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.mac-menu-bar {
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgb(250 252 255 / 82%);
  box-shadow: 0 1px 0 rgb(255 255 255 / 45%);
  color: #203143;
  font-size: 11px;
  backdrop-filter: blur(20px);
}
.mac-menu-items,
.mac-menu-status {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 18px;
}
.mac-menu-brand {
  font-weight: 700;
}
.mac-menu-status {
  gap: 12px;
  font-size: 10px;
}
.mac-desktop-space {
  display: flex;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 4px 20px;
}
.mac-app-window {
  position: relative;
  width: min(1424px, 100%);
  height: min(921px, 100%);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 75%);
  border-radius: 12px;
  background: #fff;
  box-shadow:
    0 24px 80px rgb(8 24 43 / 38%),
    0 2px 8px rgb(8 24 43 / 18%);
}
.mac-window-chrome {
  position: absolute;
  inset: 0 0 auto;
  z-index: 25;
  display: grid;
  height: 34px;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border-bottom: 1px solid #d9e1e7;
  background: linear-gradient(#f8f9fb, #e9edf1);
}
.mac-window-lights {
  display: flex;
  gap: 7px;
  padding-left: 13px;
}
.mac-window-lights i {
  width: 12px;
  height: 12px;
  border: 1px solid rgb(0 0 0 / 14%);
  border-radius: 50%;
  background: #ff5f57;
}
.mac-window-lights i:nth-child(2) {
  background: #febc2e;
}
.mac-window-lights i:nth-child(3) {
  background: #28c840;
}
.mac-window-title {
  color: #687783;
  font-size: 11px;
  font-weight: 600;
}
.mac-dock {
  z-index: 30;
  display: flex;
  width: max-content;
  max-width: calc(100% - 24px);
  height: 42px;
  align-items: center;
  justify-self: center;
  gap: 8px;
  align-self: center;
  border: 1px solid rgb(255 255 255 / 44%);
  border-radius: 17px;
  background: rgb(245 248 252 / 68%);
  padding: 5px 8px;
  box-shadow: 0 8px 25px rgb(8 24 43 / 28%);
  backdrop-filter: blur(24px);
}
.mac-dock-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 48%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 2px 5px rgb(16 35 52 / 20%);
}
.mac-dock-icon img {
  width: 26px;
  height: 26px;
}
.dock-finder {
  background: linear-gradient(120deg, #46c4f2 0 50%, #1383d1 50%);
}
.dock-roxy {
  background: white;
}
.dock-safari {
  background: linear-gradient(140deg, #85e0ff, #1375ed);
}
.dock-launchpad {
  background: linear-gradient(140deg, #cd83ff, #7258e8);
}
.dock-store {
  background: linear-gradient(140deg, #64d4fa, #297de5);
}
.dock-settings {
  background: linear-gradient(140deg, #b5c5d5, #657789);
}
.roxy-browser-topbar {
  position: absolute;
  inset: 34px 0 auto;
  z-index: 20;
  display: flex;
  height: 54px;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  border-bottom: 1px solid #dce5eb;
  background: #fff;
}
.roxy-brand {
  display: flex;
  width: 182px;
  flex: 0 0 182px;
  align-items: center;
  gap: 8px;
  color: #101820;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
}
.roxy-ad-slot {
  position: relative;
  display: flex;
  height: 38px;
  min-width: 230px;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  overflow: hidden;
  border: 2px solid #e84b39;
  border-radius: 9px;
  padding: 0 10px;
  background: linear-gradient(100deg, #fff 0%, #f0f8ff 50%, #fff 100%);
  text-decoration: none;
}
.roxy-ad-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  color: #546879;
  font-size: 12px;
  white-space: nowrap;
}
.roxy-ad-copy strong {
  color: #15395e;
  font-size: 13px;
}
.roxy-ad-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.roxy-ad-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  border-radius: 5px;
  padding: 5px 9px;
  background: linear-gradient(110deg, #21a7f5, #7863f3);
  color: white;
  font-size: 11px;
  font-weight: 600;
}
.roxy-top-actions {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.roxy-buy,
.roxy-location,
.roxy-team {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #26394a;
  font-size: 12px;
}
.roxy-buy {
  border-radius: 18px;
  padding: 7px 10px;
  background: linear-gradient(100deg, #20aaff, #9067ed);
  color: #fff;
}
.roxy-divider {
  width: 1px;
  height: 24px;
  background: #dfe6eb;
}
.roxy-location {
  max-width: 230px;
  overflow: hidden;
}
.roxy-location span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.roxy-icon-button {
  position: relative;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d3dce2;
  border-radius: 6px;
  background: #fff;
  color: #617482;
}
.roxy-count {
  position: absolute;
  top: -8px;
  right: -7px;
  display: grid;
  min-width: 17px;
  height: 17px;
  place-items: center;
  border-radius: 99px;
  background: #ff4c55;
  color: white;
  font-size: 10px;
}
.roxy-team {
  font-weight: 600;
}
.roxy-avatar {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 7px;
  background: #111;
  color: white;
}
.roxy-side-nav {
  position: absolute;
  inset: 88px auto 0 0;
  z-index: 10;
  display: flex;
  width: 220px;
  flex-direction: column;
  border-right: 1px solid #d7e1e8;
  background: linear-gradient(180deg, #f4fbff, #f0f3ff);
  padding: 10px 16px 14px;
}
.roxy-create-window {
  display: flex;
  height: 37px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  background: #1599ed;
  color: white;
  font-size: 13px;
  font-weight: 600;
}
.roxy-menu-list {
  display: grid;
  gap: 2px;
  margin-top: 11px;
}
.roxy-menu-item {
  display: flex;
  min-height: 37px;
  align-items: center;
  gap: 11px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  padding: 0 11px;
  color: #172b3a;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
}
.roxy-menu-item.is-active {
  background: #ccecff;
  color: #0086d5;
}
.roxy-menu-item.is-indent {
  position: relative;
  margin: 1px 0 0 20px;
  min-height: 34px;
  padding-left: 24px;
  font-weight: 500;
}
.roxy-menu-item.is-indent::before {
  position: absolute;
  top: -7px;
  bottom: 17px;
  left: 0;
  width: 1px;
  background: #dce7ee;
  content: '';
}
.roxy-menu-suffix {
  color: #ef4947;
  font-size: 11px;
}
.roxy-ai-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  color: #73869a;
  font-size: 12px;
  font-weight: 700;
}
.roxy-ai-list {
  margin-top: 4px;
}
.roxy-menu-item .roxy-ai-accent {
  color: #b054dc;
}
.roxy-ai-pill {
  border-radius: 7px;
  background: linear-gradient(90deg, #31b8ff, #9d6aff);
  padding: 2px 5px;
  color: white;
  font-size: 9px;
}
.roxy-side-bottom {
  display: grid;
  gap: 10px;
  margin-top: auto;
}
.roxy-promo-card {
  min-height: 62px;
  border-radius: 8px;
  background:
    radial-gradient(ellipse at 100% 110%, #1699f4, transparent 46%), linear-gradient(120deg, #121e3d, #050a17);
  padding: 9px 10px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.roxy-promo-icons {
  display: flex;
  gap: 4px;
  margin-top: 7px;
}
.roxy-promo-icons span {
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  color: #365275;
  font-size: 10px;
}
.roxy-plan-card {
  border: 1px solid #e4eef7;
  border-radius: 8px;
  background: #fff;
  padding: 9px 10px 10px;
}
.roxy-free-pill {
  border-radius: 10px;
  background: #e6f2f9;
  padding: 3px 8px;
  color: #5c8297;
  font-size: 10px;
  font-weight: 700;
}
.roxy-usage-bar {
  height: 8px;
  margin-top: 11px;
  overflow: hidden;
  border-radius: 10px;
  background: #e6edf2;
}
.roxy-usage-bar i {
  display: block;
  width: 80%;
  height: 100%;
  background: repeating-linear-gradient(90deg, #16a3fa 0 32%, #fff 32% 34%);
}
.roxy-usage-label {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 11px;
}
.roxy-usage-label span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #566879;
}
.roxy-upgrade {
  width: 100%;
  margin-top: 9px;
  border: 1px solid #aa68ed;
  border-radius: 6px;
  background: #fff;
  padding: 6px;
  color: #9b4be0;
  font-size: 11px;
  font-weight: 700;
}
.roxy-workspace {
  position: absolute;
  inset: 88px 0 0 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dce5eb;
  border-radius: 0 0 9px 9px;
  background: white;
}
.roxy-workspace-header {
  flex: 0 0 auto;
  border-bottom: 1px solid #dce5eb;
}
.roxy-tabs {
  display: flex;
  height: 46px;
  align-items: stretch;
  gap: 14px;
  border-bottom: 1px solid #e6edf2;
  padding: 0 24px;
}
.roxy-tabs button {
  position: relative;
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  padding: 0 8px;
  color: #566675;
  font-size: 12px;
}
.roxy-tabs button.is-current {
  color: #172b3b;
  font-weight: 700;
}
.roxy-tabs button.is-current::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #129cf1;
  content: '';
}
.roxy-toolbar {
  display: flex;
  min-height: 50px;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 24px;
}
.roxy-quick-create,
.roxy-search,
.roxy-filter,
.roxy-ai-action,
.roxy-proxy-check {
  display: inline-flex;
  height: 28px;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  border: 1px solid #c8d5df;
  border-radius: 5px;
  background: #fff;
  padding: 0 8px;
  color: #52616c;
  font-size: 11px;
}
.roxy-quick-create {
  border-color: #14a0f5;
  color: #148fe0;
}
.roxy-search {
  width: 142px;
  color: #8797a3;
}
.roxy-search input {
  width: 100%;
  border: 0;
  outline: 0;
  font-size: 11px;
}
.roxy-filter {
  border: 0;
}
.roxy-ai-action {
  border-color: #e1d8ff;
  color: #b36ce5;
}
.roxy-proxy-check {
  font-weight: 600;
}
.roxy-table-scroll {
  flex: 1;
  overflow: auto;
}
.roxy-window-table {
  width: 100%;
  min-width: 870px;
  border-collapse: collapse;
}
.roxy-window-table th {
  height: 37px;
  background: #f7fafc;
  color: #354553;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.roxy-window-table td {
  height: 60px;
  border-top: 1px solid #dbe4ea;
  padding: 0 9px;
  color: #334653;
  font-size: 12px;
}
.roxy-window-table th:first-child,
.roxy-window-table td:first-child {
  width: 44px;
  padding-left: 24px;
}
.roxy-window-table th:nth-child(2) {
  width: 88px;
  text-align: left;
}
.roxy-window-table th:nth-child(3) {
  min-width: 240px;
  text-align: left;
}
.roxy-window-table th:nth-child(4),
.roxy-window-table th:nth-child(5),
.roxy-window-table th:nth-child(6),
.roxy-window-table th:nth-child(9) {
  text-align: center;
}
.roxy-window-table input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: #1499ed;
}
.roxy-window-name {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.roxy-os-icon {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border: 1px solid #d4dce2;
  border-radius: 5px;
  background: white;
  color: #237be7;
  font-size: 20px;
  font-weight: 700;
  white-space: pre-line;
}
.roxy-os-icon.is-mac {
  font-size: 7px;
  line-height: 1;
}
.roxy-link-dots {
  width: 22px;
  border-top: 2px dotted #d0d9df;
}
.roxy-platform-icon {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border: 1px solid #d4dce2;
  border-radius: 5px;
  color: #72818a;
}
.roxy-platform-icon.is-facebook {
  color: #1877f2;
  font-weight: 800;
}
.roxy-open-window,
.roxy-project {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #ccd9e1;
  border-radius: 5px;
  background: white;
  padding: 4px 8px;
  color: #3f535f;
  font-size: 11px;
  white-space: nowrap;
}
.roxy-note,
.roxy-tag,
.roxy-row-more {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #6d8492;
}
.roxy-note {
  color: #119cec;
  font-size: 16px;
}
.roxy-tag {
  border: 1px solid #d0dce3;
  border-radius: 50%;
  background: #eef3f6;
}
.roxy-project {
  background: #eaf0f4;
}
.roxy-row-more {
  border-radius: 5px;
}
.roxy-pagination {
  display: flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  color: #5f7180;
  font-size: 11px;
}
.roxy-pagination > button,
.roxy-page-controls button,
.roxy-page-controls input {
  display: inline-flex;
  height: 27px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #ccd8e0;
  border-radius: 5px;
  background: white;
  padding: 0 8px;
  color: #526573;
  font-size: 11px;
}
.roxy-page-controls {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}
.roxy-page-controls input {
  width: 42px;
}
.roxy-page-controls button.is-page {
  border-color: #119cf3;
  color: #119cf3;
}
.roxy-support {
  position: absolute;
  right: 17px;
  bottom: 18px;
  z-index: 15;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #13a2f6;
  color: white;
  box-shadow: 0 5px 16px #199fe54a;
}
.roxy-demo-back {
  position: absolute;
  right: 16px;
  bottom: 72px;
  z-index: 15;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #dce5eb;
  border-radius: 20px;
  background: #fff;
  padding: 6px 10px;
  color: #617482;
  font-size: 11px;
  box-shadow: 0 3px 12px #1c35451a;
}
@media (max-width: 1100px) {
  .roxy-brand {
    width: 170px;
    flex-basis: 170px;
  }
  .roxy-top-actions {
    gap: 5px;
  }
  .roxy-location {
    max-width: 32px;
  }
  .roxy-location span,
  .roxy-divider,
  .roxy-buy {
    display: none;
  }
  .roxy-workspace {
    left: 200px;
  }
  .roxy-side-nav {
    width: 200px;
  }
  .roxy-ad-copy span {
    display: none;
  }
}
@media (max-height: 680px) {
  .roxy-browser-demo {
    min-height: 0;
    grid-template-rows: 26px minmax(0, 1fr) 52px;
  }
  .mac-menu-bar {
    font-size: 10px;
  }
  .mac-dock {
    height: 44px;
    gap: 5px;
  }
  .mac-dock-icon {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }
}
@media (max-width: 700px) {
  .mac-menu-bar {
    padding: 0 9px;
  }
  .mac-menu-items {
    gap: 12px;
  }
  .mac-menu-items > span:nth-child(n + 3) {
    display: none;
  }
  .mac-menu-status {
    gap: 8px;
  }
  .mac-desktop-space {
    padding: 7px;
  }
  .mac-app-window {
    border-radius: 9px;
  }
  .mac-window-lights {
    padding-left: 9px;
  }
  .mac-window-lights i {
    width: 10px;
    height: 10px;
  }
  .mac-dock {
    gap: 4px;
    padding: 4px 6px;
  }
  .mac-dock-icon {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }
  .mac-dock-icon img {
    width: 23px;
    height: 23px;
  }
  .roxy-browser-topbar {
    gap: 8px;
    padding: 0 8px;
  }
  .roxy-brand {
    width: auto;
    flex-basis: auto;
    font-size: 14px;
  }
  .roxy-brand img {
    width: 27px;
    height: 27px;
  }
  .roxy-ad-slot {
    height: 34px;
    min-width: 0;
    padding: 0 5px;
  }
  .roxy-ad-copy {
    gap: 0;
    font-size: 10px;
  }
  .roxy-ad-copy strong {
    font-size: 10px;
  }
  .roxy-ad-button {
    padding: 5px;
    font-size: 10px;
  }
  .roxy-team,
  .roxy-icon-button,
  .roxy-location {
    display: none;
  }
  .roxy-side-nav {
    width: 58px;
    padding: 8px 5px;
  }
  .roxy-create-window {
    height: 38px;
    overflow: hidden;
    font-size: 0;
  }
  .roxy-menu-item {
    min-height: 40px;
    justify-content: center;
    padding: 0;
  }
  .roxy-menu-item span:not(.roxy-menu-suffix),
  .roxy-menu-suffix,
  .roxy-ai-heading,
  .roxy-side-bottom {
    display: none;
  }
  .roxy-menu-item.is-indent {
    margin-left: 0;
    padding-left: 0;
  }
  .roxy-ai-list .roxy-menu-item:nth-child(n + 4) {
    display: none;
  }
  .roxy-workspace {
    inset: 88px 0 0 58px;
  }
  .roxy-tabs {
    gap: 4px;
    overflow-x: auto;
    padding: 0 7px;
  }
  .roxy-tabs button {
    padding: 0 5px;
    font-size: 10px;
  }
  .roxy-toolbar {
    gap: 4px;
    overflow-x: auto;
    padding: 0 6px;
  }
  .roxy-quick-create,
  .roxy-search,
  .roxy-filter,
  .roxy-ai-action,
  .roxy-proxy-check {
    padding: 0 5px;
    font-size: 10px;
  }
  .roxy-search {
    width: 115px;
  }
  .roxy-toolbar > div {
    margin-left: 0;
  }
  .roxy-support {
    width: 36px;
    height: 36px;
  }
  .roxy-demo-back {
    right: 8px;
    bottom: 58px;
  }
}
</style>
