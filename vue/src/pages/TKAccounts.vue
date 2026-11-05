<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  ShieldCheck,
  ExternalLink,
  List,
  LayoutGrid,
  Layers,
  GripVertical,
  ListFilter,
  Check,
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
import { studio, authorize, accountDeleteReason, deleteAccount, reorderGroup } from '@/services/studio';
import { uid } from '@/services/storage';
import { dateTime } from '@/services/videoManagement';
import { toast } from 'vue-sonner';
const route = useRoute(),
  router = useRouter();
const tab = computed(() => (route.query.tab === 'groups' ? 'groups' : 'accounts'));
function parameter(key: string) {
  return typeof route.query[key] === 'string' ? (route.query[key] as string) : '';
}
function setParameter(key: string, value: string) {
  void router.replace({ query: { ...route.query, [key]: value || undefined } });
}
const query = computed({ get: () => parameter('q'), set: (value) => setParameter('q', value) });
const group = computed(() =>
  studio.value.groups.some((g) => g.id === parameter('group')) ? parameter('group') : '',
);
const status = computed(() => parameter('status'));
const view = computed(() => (parameter('view') === 'grid' ? 'grid' : 'list'));
const liveAccounts = computed(() => studio.value.accounts.filter((a) => !a.deleted));
const accounts = computed(() =>
  liveAccounts.value.filter(
    (a) =>
      (!group.value || a.groupId === group.value) &&
      (!status.value || a.status === status.value) &&
      `${a.name} ${a.handle} ${a.note}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
const selected = ref<string[]>([]),
  moveGroup = ref('ungrouped');
watch(
  () => route.query,
  () => {
    selected.value = [];
  },
);
const authOpen = ref(false),
  authStep = ref(0),
  handle = ref(''),
  authGroup = ref('ungrouped'),
  scenario = ref('成功'),
  error = ref('');
const deleteId = ref(''),
  groupName = ref(''),
  groupEditId = ref(''),
  deleteGroupId = ref(''),
  dragging = ref('');
const editor = ref<{ id: string; field: 'group' | 'note'; value: string } | null>(null);
const affected = computed(
  () =>
    studio.value.tasks.filter(
      (t) => t.accountId === deleteId.value && ['待发布', '已排期'].includes(t.status),
    ).length,
);
const deletingAccount = computed(() => studio.value.accounts.find((a) => a.id === deleteId.value));
function openAuth() {
  handle.value = '';
  authGroup.value = 'ungrouped';
  authStep.value = 0;
  error.value = '';
  scenario.value = '成功';
  authOpen.value = true;
}
function complete() {
  try {
    const a = authorize(handle.value, authGroup.value, scenario.value);
    authStep.value = 2;
    toast.success(`${a.name} 授权状态已更新`);
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function groupSave() {
  const name = groupName.value.trim();
  if (!name) {
    toast.error('请填写分组名称');
    return;
  }
  if (studio.value.groups.some((g) => g.name === name && g.id !== groupEditId.value)) {
    toast.error('分组名称已存在');
    return;
  }
  const g = studio.value.groups.find((g) => g.id === groupEditId.value);
  if (g && g.id !== 'ungrouped') g.name = name;
  else if (!g) studio.value.groups.push({ id: uid(), name });
  groupName.value = '';
  groupEditId.value = '';
}
function removeGroup() {
  if (deleteGroupId.value === 'ungrouped') return;
  studio.value.accounts
    .filter((a) => a.groupId === deleteGroupId.value)
    .forEach((a) => (a.groupId = 'ungrouped'));
  studio.value.groups = studio.value.groups.filter((g) => g.id !== deleteGroupId.value);
  if (parameter('group') === deleteGroupId.value) setParameter('group', '');
  if (moveGroup.value === deleteGroupId.value) moveGroup.value = 'ungrouped';
  if (groupEditId.value === deleteGroupId.value) {
    groupEditId.value = '';
    groupName.value = '';
  }
  deleteGroupId.value = '';
}
function move() {
  if (!studio.value.groups.some((g) => g.id === moveGroup.value)) return;
  liveAccounts.value
    .filter((a) => selected.value.includes(a.id))
    .forEach((a) => (a.groupId = moveGroup.value));
  selected.value = [];
  toast.success('已移动帐号');
}
function saveField() {
  const edit = editor.value;
  if (!edit) return;
  const account = liveAccounts.value.find((a) => a.id === edit.id);
  if (!account) {
    editor.value = null;
    return;
  }
  if (edit.field === 'group') {
    if (!studio.value.groups.some((g) => g.id === edit.value)) return;
    account.groupId = edit.value;
  } else account.note = edit.value.trim();
  editor.value = null;
  toast.success('帐号资料已保存');
}
function confirmDelete() {
  try {
    deleteAccount(deleteId.value);
    selected.value = selected.value.filter((id) => id !== deleteId.value);
    deleteId.value = '';
    toast.success('帐号已删除，待执行任务已取消');
  } catch (e) {
    toast.error((e as Error).message);
  }
}
function viewGroup(id: string) {
  void router.push({ query: { tab: 'accounts', group: id, view: parameter('view') || undefined } });
}
function shift(id: string, offset: number) {
  const index = studio.value.groups.findIndex((g) => g.id === id);
  const target = studio.value.groups[index + offset];
  if (target) reorderGroup(id, target.id);
}
function drop(id: string) {
  reorderGroup(dragging.value, id);
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
</script>
<template>
  <div class="space-y-6">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">帐号管理</h1>
        <p class="mt-2 text-[13px] text-slate-400">连接 TikTok 帐号，让内容创作与发布顺畅衔接</p>
      </div>
      <div class="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="studio-btn">
              <MoreHorizontal class="h-4 w-4" />
              更多
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="bg-white">
            <DropdownMenuItem @select="router.push('/roxy')">Roxy 窗口管理 ↗</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button class="studio-primary" @click="openAuth">
          <Plus class="h-4 w-4" />
          添加 TK 帐号
        </button>
      </div>
    </header>
    <nav class="flex gap-2 border-b border-slate-100 pb-3" aria-label="帐号分类">
      <button
        class="studio-tab"
        :class="tab === 'accounts' && 'studio-active'"
        @click="setParameter('tab', 'accounts')"
      >
        全部帐号
      </button>
      <button
        class="studio-tab"
        :class="tab === 'groups' && 'studio-active'"
        @click="setParameter('tab', 'groups')"
      >
        帐号分组
      </button>
    </nav>
    <template v-if="tab === 'accounts'">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-64">
          <Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            v-model="query"
            class="studio-field pl-9"
            aria-label="搜索帐号"
            placeholder="搜索帐号、用户名、备注"
          />
        </div>
        <button
          v-if="group || status || query"
          class="text-xs text-sky-600"
          @click="router.replace({ query: { tab: 'accounts' } })"
        >
          清除筛选
        </button>
        <span class="ml-auto text-xs text-slate-400">{{ accounts.length }} 个帐号</span>
      </div>
      <div
        v-if="selected.length"
        class="flex items-center gap-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-700"
      >
        已选 {{ selected.length }} 个帐号
        <select v-model="moveGroup" class="studio-field !w-40" aria-label="批量移动到分组">
          <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <button class="studio-btn" @click="move">移动分组</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="studio-table min-w-[960px]" aria-label="帐号列表">
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
              <th>帐号</th>
              <th>
                <div class="flex items-center gap-1">
                  帐号分组
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button aria-label="帐号分组筛选" :class="group ? 'text-sky-600' : 'text-slate-400'">
                        <ListFilter class="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="max-h-72 overflow-y-auto bg-white p-1">
                      <DropdownMenuItem @select="setParameter('group', '')">
                        <Check v-if="!group" class="mr-2 h-3 w-3" />
                        全部分组
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-for="g in studio.groups"
                        :key="g.id"
                        @select="setParameter('group', g.id)"
                      >
                        <Check v-if="group === g.id" class="mr-2 h-3 w-3" />
                        {{ g.name }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @select="setParameter('group', '')">清除分组筛选</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              <th>
                <div class="flex items-center gap-1">
                  授权状态
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button aria-label="授权状态筛选" :class="status ? 'text-sky-600' : 'text-slate-400'">
                        <ListFilter class="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="bg-white p-1">
                      <DropdownMenuItem @select="setParameter('status', '')">
                        <Check v-if="!status" class="mr-2 h-3 w-3" />
                        全部授权状态
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-for="s in ['已授权', '授权过期', '权限不足', '已解绑']"
                        :key="s"
                        @select="setParameter('status', s)"
                      >
                        <Check v-if="status === s" class="mr-2 h-3 w-3" />
                        {{ s }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @select="setParameter('status', '')">清除状态筛选</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
              <th>备注</th>
              <th>授权时间</th>
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
                  :aria-label="`选择 ${a.name}`"
                />
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white"
                  >
                    {{ a.name.slice(0, 1).toUpperCase() }}
                  </span>
                  <div>
                    <p class="font-medium text-slate-800">{{ a.name }}</p>
                    <p class="mt-1 text-[11px] text-slate-400">{{ a.handle }} · TikTok</p>
                  </div>
                </div>
              </td>
              <td>
                <button
                  class="text-sky-600 hover:underline"
                  :aria-label="`修改 ${a.name} 的分组`"
                  @click="editor = { id: a.id, field: 'group', value: a.groupId }"
                >
                  {{ studio.groups.find((g) => g.id === a.groupId)?.name || '未分组' }}
                </button>
              </td>
              <td>
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
              </td>
              <td>
                <button
                  class="max-w-56 whitespace-pre-wrap break-words text-left hover:text-sky-600"
                  :class="!a.note && 'text-slate-400'"
                  :aria-label="`修改 ${a.name} 的备注`"
                  @click="editor = { id: a.id, field: 'note', value: a.note }"
                >
                  {{ a.note || '添加备注' }}
                </button>
              </td>
              <td class="whitespace-nowrap">{{ dateTime(a.authorizedAt) }}</td>
              <td>
                <span :title="accountDeleteReason(a.id)">
                  <button
                    class="text-rose-500 disabled:text-slate-300"
                    :disabled="!!accountDeleteReason(a.id)"
                    @click="deleteId = a.id"
                  >
                    删除
                  </button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!accounts.length" class="p-16 text-center text-sm text-slate-400">
          <Users class="mx-auto mb-3 h-9 w-9 text-slate-300" />
          {{ liveAccounts.length ? '暂无符合筛选条件的帐号' : '暂无帐号，添加你的第一个 TikTok 帐号' }}
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="groupName"
          class="studio-field !w-64"
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
    </template>
    <p class="text-[11px] text-slate-400">官方授权流程演示 · 本页面不会调用 TikTok 或保存真实令牌</p>
  </div>
  <Dialog :open="authOpen" @update:open="authOpen = $event">
    <DialogContent class="max-w-lg rounded-2xl bg-white p-7">
      <DialogTitle>连接 TikTok 帐号</DialogTitle>
      <DialogDescription>通过官方授权连接帐号，发布前由你确认每条内容。</DialogDescription>
      <div v-if="authStep === 0" class="space-y-5">
        <div class="rounded-xl bg-sky-50 p-4 text-sm leading-7 text-sky-800">
          <ShieldCheck class="mb-2" />
          授权用于读取基本资料、发布内容及在独立授权允许的范围内读取内容数据。你可以随时解除绑定。
        </div>
        <button class="studio-primary w-full" @click="authStep = 1">
          前往 TikTok 授权（演示）
          <ExternalLink class="h-4 w-4" />
        </button>
      </div>
      <div v-else-if="authStep === 1" class="space-y-4">
        <p class="text-xs text-slate-400">模拟 TikTok 授权回调</p>
        <label class="block">
          <span class="studio-label">TikTok 用户名</span>
          <input v-model="handle" class="studio-field" placeholder="@your.brand" />
        </label>
        <label class="block">
          <span class="studio-label">所属分组</span>
          <select v-model="authGroup" class="studio-field">
            <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </label>
        <label class="block">
          <span class="studio-label">演示结果</span>
          <select v-model="scenario" class="studio-field">
            <option v-for="s in ['成功', '拒绝', '取消', '过期', '权限不足']" :key="s">{{ s }}</option>
          </select>
        </label>
        <p v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
        <button class="studio-primary w-full" @click="complete">完成授权</button>
      </div>
      <div v-else class="py-6 text-center">
        <ShieldCheck class="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h3 class="font-semibold">授权结果已保存</h3>
        <p class="my-4 text-sm text-slate-400">下一步：在项目设置中关联帐号，开始发布。</p>
        <button class="studio-primary" @click="authOpen = false">返回帐号列表</button>
      </div>
    </DialogContent>
  </Dialog>
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
