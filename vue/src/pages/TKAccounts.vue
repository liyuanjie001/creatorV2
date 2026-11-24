<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  List,
  LayoutGrid,
  Layers,
  GripVertical,
  RefreshCw,
  UserRound,
  ExternalLink,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import {
  studio,
  storageError,
  accountDeleteReason,
  deleteAccount,
  reorderGroup,
  saveAccountGroup,
  removeAccountGroup,
  moveAccountsToGroup,
  saveAccountNote,
  refreshAccounts,
  syncAccountData,
} from '@/services/studio';
import { dateTime } from '@/services/videoManagement';
import { toast } from 'vue-sonner';
import AccountAuthorization from '@/components/studio/AccountAuthorization.vue';
import { platformName, accountPlatform, platforms } from '@/services/accounts';
import {
  accountOverview,
  accountHomepage,
  authorizationStatuses,
  matchesAuthorization,
} from '@/services/accountManagement';
import type { TKAccount } from '@/types/studio';
import { canUseAccount, isTeamAdmin } from '@/services/team';
const route = useRoute(),
  router = useRouter();
function parameter(key: string) {
  return typeof route.query[key] === 'string' ? (route.query[key] as string) : '';
}
function setParameter(key: string, value: string) {
  const location = { query: { ...route.query, [key]: value || undefined } };
  void (key === 'q' ? router.replace(location) : router.push(location));
}
const groupsOpen = computed({
  get: () => parameter('tab') === 'groups',
  set: (value) => setParameter('tab', value ? 'groups' : ''),
});
const groupButton = ref<HTMLButtonElement>();
watch(groupsOpen, async (open) => {
  if (!open) {
    await nextTick();
    groupButton.value?.focus();
  }
});
const query = computed({ get: () => parameter('q'), set: (value) => setParameter('q', value) });
const group = computed(() =>
  studio.value.groups.some((g) => g.id === parameter('group')) ? parameter('group') : '',
);
const status = computed(() => parameter('status'));
const view = computed(() => (parameter('view') === 'grid' ? 'grid' : 'list'));
const liveAccounts = computed(() => studio.value.accounts.filter((a) => !a.deleted && (isTeamAdmin.value || canUseAccount(a.id))));
const platformAccounts = computed(() =>
  liveAccounts.value.filter((a) => !parameter('platform') || accountPlatform(a) === parameter('platform')),
);
const validCount = computed(() => platformAccounts.value.filter((a) => a.status === '已授权').length);
const accounts = computed(() =>
  platformAccounts.value.filter(
    (a) =>
      (!group.value || a.groupId === group.value) &&
      matchesAuthorization(a, status.value) &&
      (a.name + ' ' + a.handle + ' ' + a.note).toLowerCase().includes(query.value.trim().toLowerCase()),
  ),
);
const summaries = computed(() =>
  Object.fromEntries(accounts.value.map((a) => [a.id, accountOverview(studio.value, a.id)])),
);
const number = (value?: number) => (value === undefined ? '—' : value.toLocaleString('zh-CN'));
const selected = ref<string[]>([]),
  moveGroup = ref('ungrouped');
watch(
  () => route.query,
  () => {
    selected.value = [];
  },
);
const authOpen = ref(false),
  authAccount = ref<TKAccount | null>(null);
const deleteId = ref(''),
  groupName = ref(''),
  groupEditId = ref(''),
  deleteGroupId = ref(''),
  dragging = ref('');
const actionError = ref(''),
  syncing = ref<string[]>([]),
  refreshing = ref(false);
const editor = ref<{ id: string; field: 'group' | 'note'; value: string } | null>(null);
const affected = computed(
  () =>
    studio.value.tasks.filter(
      (t) => t.accountId === deleteId.value && ['待发布', '已排期'].includes(t.status),
    ).length,
);
const deletingAccount = computed(() => studio.value.accounts.find((a) => a.id === deleteId.value));
function attempt(action: () => void) {
  try {
    actionError.value = '';
    action();
    return true;
  } catch (error) {
    actionError.value = (error as Error).message;
    toast.error(actionError.value);
    return false;
  }
}
function openAuth(account: TKAccount | null = null) {
  authAccount.value = account;
  authOpen.value = true;
}
function details(account: TKAccount) {
  void router.push({ path: '/accounts/' + account.id, query: { returnTo: route.fullPath } });
}
function groupSave() {
  attempt(() => {
    saveAccountGroup(groupName.value, groupEditId.value);
    groupName.value = '';
    groupEditId.value = '';
    toast.success('分组已保存');
  });
}
function removeGroup() {
  attempt(() => {
    const id = deleteGroupId.value;
    removeAccountGroup(id);
    if (parameter('group') === id) setParameter('group', '');
    if (moveGroup.value === id) moveGroup.value = 'ungrouped';
    if (groupEditId.value === id) {
      groupEditId.value = '';
      groupName.value = '';
    }
    deleteGroupId.value = '';
    toast.success('分组已删除');
  });
}
function move() {
  attempt(() => {
    moveAccountsToGroup(selected.value, moveGroup.value);
    selected.value = [];
    toast.success('已移动帐号');
  });
}
function saveField() {
  const edit = editor.value;
  if (!edit) return;
  attempt(() => {
    if (edit.field === 'group') moveAccountsToGroup([edit.id], edit.value);
    else saveAccountNote(edit.id, edit.value);
    editor.value = null;
    toast.success('帐号资料已保存');
  });
}
function confirmDelete() {
  attempt(() => {
    deleteAccount(deleteId.value);
    selected.value = selected.value.filter((id) => id !== deleteId.value);
    deleteId.value = '';
    toast.success('帐号已删除，待执行任务已取消');
  });
}
function viewGroup(id: string) {
  void router.push({ query: { ...route.query, tab: undefined, group: id } });
}
function shift(id: string, offset: number) {
  const index = studio.value.groups.findIndex((g) => g.id === id),
    target = studio.value.groups[index + offset];
  if (target) attempt(() => reorderGroup(id, target.id));
}
function drop(id: string) {
  attempt(() => reorderGroup(dragging.value, id));
  dragging.value = '';
}
function startDrag(event: DragEvent, id: string) {
  dragging.value = id;
  event.dataTransfer?.setData('text/plain', id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function count(id: string) {
  return liveAccounts.value.filter((a) => a.groupId === id).length;
}
function toggleAll() {
  selected.value = accounts.value.every((a) => selected.value.includes(a.id))
    ? []
    : accounts.value.map((a) => a.id);
}
async function sync(account: TKAccount) {
  if (syncing.value.includes(account.id)) return;
  if (account.status !== '已授权') {
    toast.error('请先授权账号再同步数据');
    openAuth(account);
    return;
  }
  const ownerIds = [...syncing.value, account.id];
  syncing.value = ownerIds;
  actionError.value = '';
  try {
    await syncAccountData(account.id);
    toast.success('演示数据同步完成');
  } catch (error) {
    actionError.value = (error as Error).message;
    toast.error(actionError.value);
  } finally {
    syncing.value = syncing.value.filter((id) => id !== account.id);
  }
}
async function refresh() {
  if (refreshing.value || syncing.value.length) return;
  refreshing.value = true;
  await nextTick();
  attempt(() => {
    refreshAccounts();
    selected.value = [];
    toast.success('已刷新本地数据');
  });
  refreshing.value = false;
}
</script>
<template>
  <div class="min-w-0 space-y-5" aria-label="账号管理页面">
    <h1 class="text-xl font-semibold text-slate-900">帐号管理</h1>
    <nav class="flex flex-wrap gap-2" aria-label="帐号平台分类">
      <button
        v-for="item in [{ value: '', label: '全部平台' }, ...platforms]"
        :key="item.value || 'all'"
        type="button"
        class="rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        :class="
          parameter('platform') === item.value
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
        "
        :aria-pressed="parameter('platform') === item.value"
        @click="setParameter('platform', item.value)"
      >
        {{ item.label }}
      </button>
    </nav>
    <section data-tour="account-data" class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="账号统计">
      <div
        v-for="item in [
          {
            label: parameter('platform')
              ? platformName(parameter('platform') as TKAccount['platform']) + ' 账号'
              : '账号总数',
            value: platformAccounts.length,
          },
          { label: '授权有效', value: validCount },
          { label: '需要处理', value: platformAccounts.length - validCount },
        ]"
        :key="item.label"
        class="rounded-xl border border-slate-200 bg-white px-5 py-4"
      >
        <p class="text-xs text-slate-400">{{ item.label }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-800">{{ item.value }}</p>
      </div>
    </section>
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="relative w-full sm:w-60">
        <Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          class="studio-field pl-9"
          aria-label="搜索帐号"
          placeholder="搜索账号、用户名、备注"
        />
      </div>
      <select
        :value="status"
        aria-label="授权状态筛选"
        class="studio-field !w-auto max-w-full"
        @change="setParameter('status', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部授权状态</option>
        <option v-for="item in authorizationStatuses" :key="item" :value="item">{{ item }}</option>
        <option v-if="status === '在线' || status === '登录过期'" :value="status">{{ status }}</option>
      </select>
      <select
        :value="group"
        aria-label="帐号分组筛选"
        class="studio-field !w-auto max-w-full"
        @change="setParameter('group', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部分组</option>
        <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <button data-tour="accounts-bind" class="studio-primary" @click="openAuth()">
        <Plus class="h-4 w-4" />
        绑定账号
      </button>
      <button ref="groupButton" class="studio-btn" @click="groupsOpen = true">
        <Layers class="h-4 w-4" />
        管理分组
      </button>
      <button
        v-if="group || status || query || parameter('platform')"
        class="px-2 text-xs text-sky-600"
        @click="router.push({ query: {} })"
      >
        清除筛选
      </button>
      <div class="ml-auto flex items-center gap-3">
        <span class="text-xs text-slate-400">{{ accounts.length }} 个账号</span>
        <button class="studio-btn" :disabled="refreshing || !!syncing.length" @click="refresh">
          <RefreshCw class="h-3.5 w-3.5" :class="refreshing && 'animate-spin'" />
          刷新
        </button>
      </div>
    </div>
    <p
      v-if="actionError || storageError"
      role="alert"
      class="rounded-lg bg-rose-50 p-3 text-sm text-rose-600"
    >
      {{ actionError || storageError }}
    </p>
    <div
      v-if="selected.length"
      class="flex flex-wrap items-center gap-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-700"
    >
      已选 {{ selected.length }} 个账号
      <select v-model="moveGroup" class="studio-field !w-40 max-w-full" aria-label="批量移动到分组">
        <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <button class="studio-btn" @click="move">移动分组</button>
    </div>
    <div
      class="max-w-full overflow-x-auto rounded-xl border border-slate-200"
      tabindex="0"
      aria-label="账号表格滚动区域"
    >
      <table class="studio-table min-w-[1750px]" aria-label="帐号列表">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                class="h-4 w-4 accent-sky-500"
                aria-label="选择全部帐号"
                :checked="!!accounts.length && accounts.every((a) => selected.includes(a.id))"
                :disabled="!accounts.length"
                @change="toggleAll"
              />
            </th>
            <th>账号</th>
            <th>平台</th>
            <th>分组</th>
            <th>播放量</th>
            <th>获赞</th>
            <th>最近发布</th>
            <th>粉丝</th>
            <th>关注</th>
            <th>作品</th>
            <th>授权状态</th>
            <th>数据更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.id">
            <td>
              <input
                v-model="selected"
                type="checkbox"
                class="h-4 w-4 accent-sky-500"
                :value="a.id"
                :aria-label="'选择 ' + a.name"
              />
            </td>
            <td class="min-w-64 max-w-80">
              <div class="flex items-start gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-500">
                  <UserRound class="h-6 w-6" />
                </span>
                <div class="min-w-0">
                  <button
                    class="max-w-56 truncate text-left font-medium text-slate-800 hover:text-sky-600"
                    @click="details(a)"
                  >
                    {{ a.name }}
                  </button>
                  <p class="mt-1 max-w-56 truncate text-[11px] text-slate-400">
                    {{ a.handle }}
                    <span
                      v-if="a.source === 'recharge'"
                      class="ml-1 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-600"
                    >
                      购买账号
                    </span>
                  </p>
                  <button
                    class="mt-1 block max-w-56 truncate text-left text-[11px] text-slate-400 hover:text-sky-600"
                    :title="a.note"
                    :aria-label="'修改 ' + a.name + ' 的备注'"
                    @click="editor = { id: a.id, field: 'note', value: a.note }"
                  >
                    备注：{{ a.note || '—' }}
                  </button>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap">
              {{ platformName(accountPlatform(a)) }}
              <p v-if="accountPlatform(a) === 'youtube'" class="mt-1 text-[10px] text-slate-400">
                暂不支持发布
              </p>
            </td>
            <td>
              <button
                class="max-w-28 truncate text-sky-600 hover:underline"
                :aria-label="'修改 ' + a.name + ' 的分组'"
                @click="editor = { id: a.id, field: 'group', value: a.groupId }"
              >
                {{ studio.groups.find((g) => g.id === a.groupId)?.name || '未分组' }}
              </button>
            </td>
            <td>
              {{ number(summaries[a.id]?.views) }}
              <p v-if="summaries[a.id]?.partial" class="mt-1 text-[10px] text-amber-500">部分数据</p>
            </td>
            <td>{{ number(a.statistics?.likes) }}</td>
            <td class="whitespace-nowrap text-[11px]">{{ dateTime(summaries[a.id]?.latest) }}</td>
            <td>{{ number(a.statistics?.followers) }}</td>
            <td>{{ number(a.statistics?.following) }}</td>
            <td>{{ summaries[a.id]?.works }}</td>
            <td class="min-w-48">
              <div class="flex items-center gap-2">
                <span
                  class="studio-badge"
                  :class="
                    a.status === '已授权'
                      ? '!bg-emerald-50 !text-emerald-600'
                      : '!bg-amber-50 !text-amber-600'
                  "
                >
                  {{ a.status }}
                </span>
                <button
                  v-if="a.status !== '已授权'"
                  class="whitespace-nowrap text-xs text-sky-600"
                  @click="openAuth(a)"
                >
                  重新授权
                </button>
              </div>
              <p class="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                授权到期：{{ dateTime(a.authorizationExpiresAt) }}
              </p>
              <p class="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                授权：{{ dateTime(a.authorizedAt) }}
              </p>
            </td>
            <td class="whitespace-nowrap text-[11px]">{{ dateTime(a.dataUpdatedAt) }}</td>
            <td>
              <div class="flex items-center gap-3 whitespace-nowrap text-xs text-sky-600">
                <a
                  :href="accountHomepage(a)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="a.name + ' 平台主页'"
                  class="inline-flex items-center gap-1"
                >
                  平台主页
                  <ExternalLink class="h-3 w-3" />
                </a>
                <button data-tour="account-data-link" @click="details(a)">数据看板</button>
                <button
                  class="inline-flex items-center gap-1 disabled:text-slate-400"
                  :disabled="syncing.includes(a.id)"
                  :aria-label="'同步 ' + a.name + ' 的数据'"
                  @click="sync(a)"
                >
                  <RefreshCw class="h-3 w-3" :class="syncing.includes(a.id) && 'animate-spin'" />
                  {{ syncing.includes(a.id) ? '同步中' : '数据同步' }}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button class="inline-flex items-center gap-1" :aria-label="a.name + ' 更多操作'">
                      更多
                      <MoreHorizontal class="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="bg-white">
                    <DropdownMenuItem @select="editor = { id: a.id, field: 'group', value: a.groupId }">
                      修改分组
                    </DropdownMenuItem>
                    <DropdownMenuItem @select="editor = { id: a.id, field: 'note', value: a.note }">
                      修改备注
                    </DropdownMenuItem>
                    <DropdownMenuItem @select="openAuth(a)">重新授权</DropdownMenuItem>
                    <DropdownMenuItem
                      :disabled="!!accountDeleteReason(a.id)"
                      :title="accountDeleteReason(a.id)"
                      class="text-rose-500"
                      @select="deleteId = a.id"
                    >
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!accounts.length" class="p-12 text-center text-sm text-slate-400">
        <Users class="mx-auto mb-3 h-9 w-9 text-slate-300" />
        {{ liveAccounts.length ? '暂无符合筛选条件的账号' : '暂无账号，绑定你的第一个平台账号' }}
      </div>
    </div>
    <p class="text-[11px] text-slate-400">演示数据 · 数据同步仅在本地运行，不调用平台 API 或保存真实令牌。</p>
  </div>
  <Dialog v-model:open="groupsOpen">
    <DialogContent
      class="max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6"
    >
      <DialogTitle>管理分组</DialogTitle>
      <DialogDescription>按业务整理账号，分组内账号和发布记录会保留。</DialogDescription>
      <p v-if="actionError" role="alert" class="text-sm text-rose-600">{{ actionError }}</p>

      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="groupName"
          class="studio-field !w-64 max-w-full"
          aria-label="分组名称"
          placeholder="输入分组名称"
          maxlength="30"
          @keydown.enter="groupSave"
        />
        <button class="studio-primary" @click="groupSave">{{ groupEditId ? '保存分组' : '新建分组' }}</button>
        <button
          v-if="groupEditId"
          class="studio-btn"
          @click="
            groupEditId = '';
            groupName = '';
          "
        >
          取消
        </button>
        <div
          class="ml-auto flex h-10 rounded-xl border border-slate-200 bg-slate-50 p-1"
          aria-label="分组展示方式"
        >
          <button
            v-for="item in [
              { key: 'list', icon: List, label: '列表视图' },
              { key: 'grid', icon: LayoutGrid, label: '缩略图视图' },
            ]"
            :key="item.key"
            class="grid h-8 w-8 place-items-center rounded-lg"
            :class="view === item.key ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'"
            :aria-label="item.label"
            :aria-pressed="view === item.key"
            @click="setParameter('view', item.key)"
          >
            <component :is="item.icon" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div :class="view === 'list' ? 'overflow-x-auto rounded-xl border border-slate-200' : ''">
        <div
          v-if="view === 'list'"
          class="grid grid-cols-[48px_minmax(220px,1fr)_160px_100px] bg-slate-50 px-4 py-4 text-xs text-slate-400"
          aria-hidden="true"
        >
          <span />
          <span>分组信息</span>
          <span>操作</span>
          <span>帐号数量</span>
        </div>
        <div
          :class="view === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'min-w-[600px]'"
          role="list"
          aria-label="帐号分组列表"
        >
          <div
            v-for="(g, index) in studio.groups"
            :key="g.id"
            :data-group-id="g.id"
            role="listitem"
            :class="[
              view === 'list'
                ? 'grid grid-cols-[48px_minmax(220px,1fr)_160px_100px] items-center border-t border-slate-100 px-4 py-5 hover:bg-slate-50/60'
                : 'studio-card flex flex-wrap items-center gap-3',
              dragging === g.id && 'opacity-50',
            ]"
            @dragover.prevent
            @drop.prevent="drop(g.id)"
          >
            <button
              v-if="view === 'list'"
              draggable="true"
              class="w-fit cursor-grab rounded p-1 text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-400"
              :aria-label="`排序 ${g.name}，方向键上下移动`"
              @dragstart="startDrag($event, g.id)"
              @dragend="dragging = ''"
              @keydown.up.prevent="shift(g.id, -1)"
              @keydown.down.prevent="shift(g.id, 1)"
            >
              <GripVertical class="h-4 w-4" />
            </button>
            <div class="flex min-w-0 items-center gap-3" :class="view === 'grid' && 'w-full'">
              <Layers class="h-5 w-5 shrink-0 text-slate-500" />
              <span class="break-words text-sm font-medium text-slate-800">{{ g.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="studio-btn !h-8 !px-3 !text-xs"
                :aria-label="`查看 ${g.name}`"
                @click="viewGroup(g.id)"
              >
                查看
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button class="rounded p-2 text-slate-400" :aria-label="`${g.name} 更多操作`">
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="bg-white p-1">
                  <DropdownMenuItem :disabled="index === 0" @select="shift(g.id, -1)">上移</DropdownMenuItem>
                  <DropdownMenuItem :disabled="index === studio.groups.length - 1" @select="shift(g.id, 1)">
                    下移
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="g.id !== 'ungrouped'"
                    @select="
                      groupEditId = g.id;
                      groupName = g.name;
                    "
                  >
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="g.id !== 'ungrouped'"
                    class="text-rose-500"
                    @select="deleteGroupId = g.id"
                  >
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span class="text-sm text-slate-600" :class="view === 'grid' && 'ml-auto'">
              {{ count(g.id) }}
              <span v-if="view === 'grid'" class="ml-1 text-xs text-slate-400">个帐号</span>
            </span>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <AccountAuthorization :open="authOpen" :account="authAccount" @update:open="authOpen = $event" />
  <Dialog :open="!!editor" @update:open="!$event && (editor = null)">
    <DialogContent class="max-w-md bg-white p-6">
      <DialogTitle>{{ editor?.field === 'group' ? '修改帐号分组' : '修改备注' }}</DialogTitle>
      <DialogDescription>保存后立即更新帐号列表。</DialogDescription>
      <template v-if="editor">
        <select
          v-if="editor.field === 'group'"
          v-model="editor.value"
          class="studio-field"
          aria-label="帐号分组"
        >
          <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <textarea
          v-else
          v-model="editor.value"
          class="studio-field h-28 py-3"
          aria-label="帐号备注"
          maxlength="500"
        />
        <div class="flex justify-end gap-2">
          <button class="studio-btn" @click="editor = null">取消</button>
          <button class="studio-primary" @click="saveField">保存</button>
        </div>
      </template>
    </DialogContent>
  </Dialog>
  <Dialog :open="!!deleteId" @update:open="!$event && (deleteId = '')">
    <DialogContent class="max-w-md bg-white p-6">
      <DialogTitle>删除帐号？</DialogTitle>
      <DialogDescription>
        确认删除 {{ deletingAccount?.handle }}？将取消
        {{ affected }}
        条待发布或已排期任务，并移除项目关联。历史发布与统计仍保留，删除后该帐号不能继续用于发布。
      </DialogDescription>
      <div class="flex justify-end gap-2">
        <button class="studio-btn" @click="deleteId = ''">取消</button>
        <button class="studio-primary" :disabled="!!accountDeleteReason(deleteId)" @click="confirmDelete">
          确认删除帐号
        </button>
      </div>
    </DialogContent>
  </Dialog>
  <Dialog :open="!!deleteGroupId" @update:open="!$event && (deleteGroupId = '')">
    <DialogContent class="max-w-md bg-white p-6">
      <DialogTitle>删除分组？</DialogTitle>
      <DialogDescription>分组内帐号会移入“未分组”，帐号与历史记录不会删除。</DialogDescription>
      <div class="flex justify-end gap-2">
        <button class="studio-btn" @click="deleteGroupId = ''">取消</button>
        <button class="studio-primary" @click="removeGroup">确认删除分组</button>
      </div>
    </DialogContent>
  </Dialog>
</template>
