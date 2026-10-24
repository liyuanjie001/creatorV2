<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Monitor,
  RefreshCw,
  Plus,
  ArrowRight,
  CircleCheck,
  ShieldAlert,
  Layers,
  Search,
} from 'lucide-vue-next';
import { Button, Card, Dialog, DialogContent, DialogTitle, DialogDescription, Input } from '@/components/ui';
import { PageHeader, PlatformBadge } from '@/components/shared';
import ComingSoonMask from '@/components/ComingSoonMask.vue';
import { useWindowManager } from '@/composables/useWindowManager';
import { roxyProjects } from '@/data/windowDemo';
import { platforms } from '@/data/mock';
import type { BrowserWindow } from '@/types/windows';
import RoxyBindingDialog from '@/components/windows/RoxyBindingDialog.vue';
import WindowDetailDialog from '@/components/windows/WindowDetailDialog.vue';

const manager = useWindowManager();
const route = useRoute();
const router = useRouter();
const { bound, windows, accounts, syncedAt, storageUnavailable } = manager;
const wizardOpen = ref(false);
const wizardStart = ref<'key' | 'projects'>('key');
const resetOpen = ref(false);
const search = ref('');
const projectFilter = ref('all');
const platformFilter = ref('all');
const statusFilter = ref('all');
const detailWindowId = ref('');
const showComingSoon = ref(false);
const page = ref(1);
const pageSize = 8;
const platformCount = computed(() => new Set(accounts.value.map((a) => a.platform)).size);
const expiredCount = computed(() => accounts.value.filter((a) => a.status === '登录失效').length);
const syncTime = computed(() =>
  syncedAt.value ? new Date(syncedAt.value).toLocaleString('zh-CN', { hour12: false }) : '',
);
const filtered = computed(() =>
  windows.value.filter((window) => {
    const linked = manager.windowAccounts(window.id);
    const query = search.value.trim().toLowerCase();
    return (
      (projectFilter.value === 'all' || window.roxyProjectId === projectFilter.value) &&
      (platformFilter.value === 'all' || linked.some((a) => a.platform === platformFilter.value)) &&
      (statusFilter.value === 'all' ||
        (statusFilter.value === 'expired'
          ? linked.some((a) => a.status === '登录失效')
          : statusFilter.value === 'empty'
            ? linked.length === 0
            : linked.length > 0 && linked.every((a) => a.status === '正常'))) &&
      (!query ||
        [window.name, window.serial, window.region, ...linked.map((a) => a.handle)].some((text) =>
          text.toLowerCase().includes(query),
        ))
    );
  }),
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const pagedWindows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
function windowStatus(window: BrowserWindow) {
  const linked = manager.windowAccounts(window.id);
  return linked.length === 0
    ? '暂无登录账号'
    : linked.some((a) => a.status === '登录失效')
      ? '有账号登录失效'
      : '登录正常';
}
function collectionStatus(windowId: string) {
  const linked = manager.windowAccounts(windowId);
  if (!linked.length) return '无账号';
  const content = manager.videos.value.filter((v) => linked.some((a) => a.id === v.accountId));
  if (!content.length) return '暂无内容';
  if (content.some((v) => v.collection.kind === 'failed')) return '采集失败';
  if (content.some((v) => v.collection.kind === 'uncollected')) return '未采集';
  return '已有采集数据';
}
function bind(start: 'key' | 'projects') {
  wizardStart.value = start;
  wizardOpen.value = true;
}
function clear() {
  search.value = '';
  projectFilter.value = 'all';
  platformFilter.value = 'all';
  statusFilter.value = 'all';
  page.value = 1;
}
function reset() {
  manager.reset();
  resetOpen.value = false;
  detailWindowId.value = '';
  clear();
}
function report(id: string) {
  const account = manager.windowAccounts(id)[0];
  void router.push({
    path: '/analytics',
    query: {
      tab: 'compare',
      window: id,
      project: manager.projectForWindow(id)?.workspaceProjectId,
      platform: account?.platform,
    },
  });
}
watch([search, projectFilter, platformFilter, statusFilter], () => {
  page.value = 1;
});
watch(
  () => manager.selectedProjectIds.value.join(','),
  () => {
    clear();
  },
);
watch(
  [() => route.query.window, () => route.query.project, bound],
  ([windowId, projectId, ready]) => {
    if (!ready) return;
    if (typeof windowId === 'string' && windows.value.some((w) => w.id === windowId))
      detailWindowId.value = windowId;
    if (typeof projectId === 'string')
      projectFilter.value = roxyProjects.find((p) => p.workspaceProjectId === projectId)?.id ?? 'all';
  },
  { immediate: true },
);
</script>

<template>
  <!-- 撑满主内容白底区域，遮罩只盖当前子页面 -->
  <div class="relative -mx-8 -my-6 min-h-[calc(100vh-24px)]">
  <div class="space-y-6 px-8 py-6" :class="showComingSoon && 'pointer-events-none select-none'">
    <PageHeader title="窗口管理" desc="连接与同步浏览器窗口，管理账号身份、登录状态和采集入口">
      <template #title-extra>
        <ComingSoonMask @open="showComingSoon = true" />
      </template>
      <template #extra>
        <div class="flex gap-2">
          <Button
            v-if="bound"
            variant="outline"
            size="sm"
            class="border-slate-200 text-slate-600"
            @click="bind('projects')"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            同步数据
          </Button>
          <Button size="sm" class="brand-gradient text-white hover:opacity-90" @click="bind('key')">
            <Plus class="h-3.5 w-3.5" />
            {{ bound ? '更换绑定' : '绑定 RoxyBrowser' }}
          </Button>
        </div>
      </template>
    </PageHeader>
    <p
      v-if="storageUnavailable"
      role="status"
      class="rounded-lg bg-amber-50 px-4 py-3 text-[12px] text-amber-700"
    >
      浏览器暂时无法保存数据，本次操作仍然生效；刷新后可能需要重新演示。
    </p>
    <template v-if="!bound">
      <Card class="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-none">
        <div class="grid grid-cols-2 items-center gap-12 px-10 py-14">
          <div>
            <span
              class="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-600"
            >
              ROXYBROWSER × 出海动力
            </span>
            <h2 class="mt-5 text-3xl font-semibold leading-snug tracking-tight text-slate-800">
              一个窗口，
              <br />
              连接你的多平台矩阵
            </h2>
            <p class="mt-4 max-w-sm text-[13px] leading-7 text-slate-500">
              同步浏览器项目与窗口，识别平台账号并检查登录状态。内容表现统一在数据分析中查看。
            </p>
            <Button class="brand-gradient mt-7 text-white" @click="bind('key')">
              开始绑定与同步
              <ArrowRight class="h-4 w-4" />
            </Button>
            <p class="mt-3 text-[11px] text-slate-400">演示模式 · 无需真实 Key · 数据仅保存在当前浏览器</p>
          </div>
          <div
            class="relative rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6"
          >
            <div class="mb-5 flex items-center gap-2 border-b border-sky-100 pb-4">
              <span class="h-2 w-2 rounded-full bg-rose-200" />
              <span class="h-2 w-2 rounded-full bg-amber-200" />
              <span class="h-2 w-2 rounded-full bg-emerald-200" />
              <span class="ml-3 text-[11px] text-slate-400">RoxyBrowser 窗口</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md shadow-sky-200"
              >
                <Monitor class="h-5 w-5" />
              </div>
              <div>
                <p class="text-[14px] font-medium text-slate-700">GlowUp · 品牌主窗口</p>
                <p class="mt-1 text-[11px] text-slate-400">美区矩阵 · 独立浏览器环境</p>
              </div>
            </div>
            <div class="mt-5 space-y-2">
              <div
                v-for="p in ['TikTok', 'Instagram', 'YouTube'] as const"
                :key="p"
                class="flex items-center rounded-xl border border-white bg-white/90 px-4 py-3 shadow-sm"
              >
                <PlatformBadge :platform="p" />
                <span class="ml-auto flex items-center gap-1 text-[11px] text-emerald-600">
                  <CircleCheck class="h-3 w-3" />
                  已识别账号
                </span>
              </div>
            </div>
            <div class="mt-5 flex justify-between border-t border-sky-100 pt-4 text-[11px] text-slate-400">
              <span>窗口 → 平台账号 → 视频</span>
              <span class="text-sky-600">统一数据视角</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 border-t border-slate-100 bg-slate-50/60 px-10 py-6">
          <div
            v-for="(step, i) in [
              { title: '绑定浏览器', desc: '输入本地 API Key，建立演示连接' },
              { title: '选择同步项目', desc: '按项目选择需要管理的窗口' },
              { title: '检查账号状态', desc: '确认身份与登录，前往数据分析' },
            ]"
            :key="step.title"
            class="flex gap-3"
          >
            <span class="text-lg font-light text-sky-300">0{{ i + 1 }}</span>
            <div>
              <h3 class="text-[13px] font-medium text-slate-700">{{ step.title }}</h3>
              <p class="mt-1 text-[11px] text-slate-400">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </Card>
    </template>
    <template v-else>
      <div
        class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px]"
      >
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
          <CircleCheck class="h-4 w-4" />
        </div>
        <span class="font-medium text-slate-700">RoxyBrowser 已绑定</span>
        <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">演示</span>
        <span class="ml-auto text-[11px] text-slate-400">最近同步 {{ syncTime }}</span>
        <button class="text-sky-600 hover:text-sky-700" @click="bind('projects')">管理同步项目</button>
        <button
          class="border-l border-slate-200 pl-3 text-slate-400 hover:text-rose-500"
          @click="resetOpen = true"
        >
          重置演示
        </button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <Card
          v-for="stat in [
            {
              label: '已同步窗口',
              value: windows.length,
              hint: `${manager.selectedProjectIds.value.length} 个 RoxyBrowser 项目`,
              icon: Monitor,
            },
            {
              label: '已识别账号',
              value: accounts.length,
              hint: '每个窗口每平台一个账号',
              icon: CircleCheck,
            },
            { label: '覆盖平台', value: platformCount, hint: '多平台统一管理', icon: Layers },
            {
              label: '登录待恢复',
              value: expiredCount,
              hint: expiredCount ? '进入窗口详情恢复登录' : '所有已识别账号登录正常',
              icon: ShieldAlert,
            },
          ]"
          :key="stat.label"
          class="gap-0 border-slate-200 bg-white p-5 shadow-none"
        >
          <div class="flex items-center justify-between text-[12px] text-slate-500">
            {{ stat.label }}
            <component
              :is="stat.icon"
              class="h-4 w-4"
              :class="stat.label === '登录待恢复' && expiredCount ? 'text-amber-400' : 'text-sky-400'"
            />
          </div>
          <p class="mt-3 text-3xl font-semibold tabular-nums text-slate-800">{{ stat.value }}</p>
          <p class="mt-2 text-[11px] text-slate-400">{{ stat.hint }}</p>
        </Card>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-52 flex-1">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            v-model="search"
            aria-label="搜索窗口"
            placeholder="搜索窗口名称、编号或账号…"
            class="border-slate-200 bg-white pl-9 text-[12px]"
          />
        </div>
        <select v-model="projectFilter" aria-label="窗口项目" class="window-select">
          <option value="all">全部项目</option>
          <option
            v-for="p in roxyProjects.filter((p) => manager.selectedProjectIds.value.includes(p.id))"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}
          </option>
        </select>
        <select v-model="platformFilter" aria-label="窗口平台" class="window-select">
          <option value="all">全部平台</option>
          <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="statusFilter" aria-label="窗口登录状态" class="window-select">
          <option value="all">全部登录状态</option>
          <option value="normal">登录正常</option>
          <option value="expired">有账号登录失效</option>
          <option value="empty">暂无登录账号</option>
        </select>
        <button class="text-[12px] text-sky-600" @click="clear">清除筛选</button>
      </div>
      <Card class="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="bg-slate-50/80 text-[11px] text-slate-400">
              <tr>
                <th class="px-5 py-3 font-normal">窗口 / 所属项目</th>
                <th class="px-4 py-3 font-normal">已识别平台账号</th>
                <th class="px-4 py-3 font-normal">地区</th>
                <th class="px-4 py-3 font-normal">登录状态</th>
                <th class="px-4 py-3 font-normal">采集状态</th>
                <th class="px-5 py-3 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="window in pagedWindows"
                :key="window.id"
                class="border-t border-slate-100 hover:bg-sky-50/30"
              >
                <td class="px-5 py-4">
                  <button
                    class="text-left font-medium text-slate-700 hover:text-sky-600"
                    @click="detailWindowId = window.id"
                  >
                    {{ window.name }}
                  </button>
                  <p class="mt-1 text-[11px] text-slate-400">
                    #{{ window.serial }} · {{ manager.projectForWindow(window.id)?.name }}
                  </p>
                </td>
                <td class="max-w-64 px-4 py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="a in manager.windowAccounts(window.id)"
                      :key="a.id"
                      :title="`${a.handle} · ${a.status}`"
                      class="inline-flex items-center gap-1 rounded border px-1.5 py-1"
                      :class="a.status === '正常' ? 'border-slate-100' : 'border-amber-200 bg-amber-50'"
                    >
                      <PlatformBadge :platform="a.platform" />
                      <span v-if="a.status === '登录失效'" class="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </span>
                    <span v-if="!manager.windowAccounts(window.id).length" class="text-[11px] text-slate-400">
                      暂无账号
                    </span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-4 py-4 text-slate-500">{{ window.region }}</td>
                <td class="whitespace-nowrap px-4 py-4">
                  <span
                    class="rounded-full px-2 py-1 text-[10px]"
                    :class="
                      windowStatus(window) === '登录正常'
                        ? 'bg-emerald-50 text-emerald-600'
                        : windowStatus(window) === '暂无登录账号'
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-amber-50 text-amber-600'
                    "
                  >
                    {{ windowStatus(window) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-4 text-[11px] text-slate-500">
                  {{ collectionStatus(window.id) }}
                </td>
                <td class="whitespace-nowrap px-5 py-4 text-right">
                  <button class="text-sky-600" @click="detailWindowId = window.id">详情</button>
                  <button class="ml-3 text-slate-500 hover:text-sky-600" @click="report(window.id)">
                    查看数据
                  </button>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td colspan="6" class="py-16 text-center text-[13px] text-slate-400">
                  没有符合条件的窗口，试试清除筛选
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          class="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400"
        >
          <span>共 {{ filtered.length }} 个窗口 · 平台标记提示账号登录状态</span>
          <div class="flex gap-3">
            <button :disabled="page <= 1" class="disabled:opacity-30" @click="page--">上一页</button>
            <span>{{ page }} / {{ pages }}</span>
            <button :disabled="page >= pages" class="disabled:opacity-30" @click="page++">下一页</button>
          </div>
        </div>
      </Card>
    </template>
    <RoxyBindingDialog v-model:open="wizardOpen" :start-at="wizardStart" />
    <WindowDetailDialog v-model:window-id="detailWindowId" @report="report" />
    <Dialog v-model:open="resetOpen">
      <DialogContent class="rounded-2xl border-slate-200 bg-white">
        <DialogTitle>重置窗口管理演示？</DialogTitle>
        <DialogDescription class="text-[13px] leading-6 text-slate-500">
          将清除本地绑定、同步项目、登录恢复和运营阶段记录，返回首次绑定引导。你可以随时重新同步演示数据。
        </DialogDescription>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="resetOpen = false">取消</Button>
          <Button class="bg-rose-500 text-white hover:bg-rose-600" @click="reset">确认重置</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  <ComingSoonMask
    v-if="showComingSoon"
    mode="page"
    title="帐号管理 · 敬请期待"
    desc="多窗口与平台账号统一管理，矩阵投放更轻松。批量开号、同步登录态，让出海获客像流水线一样运转。"
    :highlights="['多平台管号', '窗口同步', '身份隔离']"
    @back="showComingSoon = false"
  />
  </div>
</template>

<style scoped>
.window-select {
  @apply h-9 max-w-52 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100;
}
</style>
