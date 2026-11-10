<script setup lang="ts">
import { Check, ChevronLeft, Sparkles } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Button } from '@/components/ui';
import { PageHeader, PlatformBadge } from '@/components/shared';
import { projects, platforms, type Platform } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, watch } from 'vue';
import { useWindowManager } from '@/composables/useWindowManager';
const router = useRouter();
const route = useRoute();
const projectId = ref(projects[0].id);
const pickedPlatforms = ref<Platform[]>(['TikTok']);
const manager = useWindowManager();
const pickedAccounts = ref<string[]>([]);
const pickedWindowIds = ref<Record<string, string>>({});
watch(
  () => route.query.project,
  (id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    projectId.value = project.id;
    pickedPlatforms.value = [project.platforms[0] ?? 'TikTok'];
    pickedAccounts.value = [];
  },
  { immediate: true },
);
const projectWindows = computed(() => manager.windowsForProject(projectId.value));
const candidateWindows = computed(() =>
  projectWindows.value.filter((w) =>
    manager.windowAccounts(w.id).some((a) => pickedPlatforms.value.includes(a.platform)),
  ),
);
const availableAccounts = computed(() =>
  manager.accounts.value.filter(
    (a) =>
      manager
        .accountWindows(a.id)
        .some((w) => projectWindows.value.some((projectWindow) => projectWindow.id === w.id)) &&
      pickedPlatforms.value.includes(a.platform) &&
      a.status === '正常',
  ),
);
watch(availableAccounts, (available) => {
  pickedAccounts.value = pickedAccounts.value.filter(
    (id) =>
      available.some((a) => a.id === id) &&
      projectWindows.value.some((w) => w.id === pickedWindowIds.value[id]),
  );
});
function accountSelected(id: string, windowId: string) {
  return pickedAccounts.value.includes(id) && pickedWindowIds.value[id] === windowId;
}
function toggleAccount(id: string, windowId: string) {
  if (!availableAccounts.value.some((a) => a.id === id)) return;
  if (accountSelected(id, windowId)) {
    pickedAccounts.value = pickedAccounts.value.filter((value) => value !== id);
    return;
  }
  if (!pickedAccounts.value.includes(id)) pickedAccounts.value = [...pickedAccounts.value, id];
  pickedWindowIds.value = { ...pickedWindowIds.value, [id]: windowId };
}
const submit = () => {
  if (!pickedPlatforms.value.length) {
    toast.warning('至少选择一个分发平台');
    return;
  }
  if (!pickedAccounts.value.some((id) => availableAccounts.value.some((a) => a.id === id))) {
    toast.warning('请选择至少一个登录正常的发布账号');
    return;
  }
  toast.success('任务创建成功（演示）', {
    description: '已加入发布队列，可在任务管理中查看',
  });
  router.push('/tasks');
};
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <PageHeader title="新建任务" desc="为项目创建一条跨平台分发任务">
      <template #extra>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 border-slate-200 text-slate-500 hover:text-slate-800"
          @click="router.push('/tasks')"
        >
          <ChevronLeft class="h-3.5 w-3.5"></ChevronLeft>
          返回任务管理
        </Button>
      </template>
    </PageHeader>
    <Card class="glass-card space-y-5 border-white/[0.07] p-6">
      <div class="space-y-1.5">
        <label class="text-[12.5px] font-medium text-slate-600">任务名称</label>
        <Input
          placeholder="例如：精华实测视频 · 美区晚间档"
          class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
        ></Input>
      </div>
      <div class="space-y-1.5">
        <label class="text-[12.5px] font-medium text-slate-600">所属项目</label>
        <div class="flex flex-wrap gap-1.5">
          <template :key="p.id" v-for="p in projects">
            <button
              @click="projectId = p.id"
              :class="
                cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                  projectId === p.id
                    ? 'border-sky-400 bg-sky-50 font-medium text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800',
                )
              "
            >
              <span
                class="h-2 w-2 rounded-full"
                :style="{
                  backgroundColor: p.color,
                }"
              ></span>
              {{ p.name }}
            </button>
          </template>
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-[12.5px] font-medium text-slate-600">分发平台</label>
        <div class="grid grid-cols-6 gap-2">
          <template :key="p" v-for="p in platforms">
            <button
              @click="
                pickedPlatforms = pickedPlatforms.includes(p)
                  ? pickedPlatforms.filter((x) => x !== p)
                  : [...pickedPlatforms, p]
              "
              :class="
                cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[12.5px] transition-colors',
                  pickedPlatforms.includes(p)
                    ? 'border-sky-400 bg-sky-50 font-medium text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800',
                )
              "
            >
              <template v-if="pickedPlatforms.includes(p)"><Check class="h-3.5 w-3.5"></Check></template>
              {{ p }}
            </button>
          </template>
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[12.5px] font-medium text-slate-600">发布窗口与账号</label>
          <button
            class="text-[12px] text-sky-600"
            @click="router.push({ path: '/accounts', query: { project: projectId } })"
          >
            管理窗口
          </button>
        </div>
        <p class="text-[11px] text-slate-400">
          仅显示当前项目已同步的窗口；共用账号只发布一次，可选择执行窗口。登录失效的账号需先恢复登录。
        </p>
        <div
          v-if="!candidateWindows.length"
          class="rounded-lg border border-dashed border-slate-200 p-6 text-center text-[12px] text-slate-400"
        >
          当前项目在所选平台暂无可用窗口。
          <button
            class="ml-1 text-sky-600"
            @click="router.push({ path: '/accounts', query: { project: projectId } })"
          >
            去同步窗口
          </button>
        </div>
        <div
          v-for="window in candidateWindows"
          :key="window.id"
          class="overflow-hidden rounded-lg border border-slate-200"
        >
          <div class="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <span>{{ window.name }}</span>
            <span>#{{ window.serial }} · {{ window.region }}</span>
          </div>
          <button
            v-for="account in manager
              .windowAccounts(window.id)
              .filter((a) => pickedPlatforms.includes(a.platform))"
            :key="account.id"
            :disabled="account.status !== '正常'"
            :aria-pressed="accountSelected(account.id, window.id)"
            :aria-label="`选择 ${account.name} ${account.platform}${manager.accountWindows(account.id).length > 1 ? ` · ${window.name}` : ''}`"
            class="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="accountSelected(account.id, window.id) ? 'bg-sky-50' : 'hover:bg-slate-50'"
            @click="toggleAccount(account.id, window.id)"
          >
            <span
              class="flex h-4 w-4 items-center justify-center rounded border"
              :class="
                accountSelected(account.id, window.id)
                  ? 'brand-gradient border-transparent text-white'
                  : 'border-slate-300'
              "
            >
              <Check v-if="accountSelected(account.id, window.id)" class="h-3 w-3" />
            </span>
            <span class="text-slate-700">{{ account.name }}</span>
            <span class="truncate text-[11px] text-slate-400">{{ account.handle }}</span>
            <span
              v-if="account.status !== '正常'"
              class="ml-auto whitespace-nowrap text-[11px] text-amber-600"
            >
              {{ account.status }}
            </span>
            <span class="ml-auto"><PlatformBadge :platform="account.platform" /></span>
          </button>
        </div>
        <p class="text-[11px] text-slate-400">已选择 {{ pickedAccounts.length }} 个发布账号</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-[12.5px] font-medium text-slate-600">发布时间</label>
          <Input
            type="datetime-local"
            default-value="2026-10-22T20:00"
            class="border-slate-200 bg-white text-[13px] text-slate-600 focus-visible:ring-sky-300"
          ></Input>
        </div>
        <div class="space-y-1.5">
          <label class="text-[12.5px] font-medium text-slate-600">引用素材</label>
          <Input
            placeholder="从素材库选择，或粘贴链接"
            class="border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
          ></Input>
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-[12.5px] font-medium text-slate-600">内容说明</label>
        <Textarea
          placeholder="给 AI 的生成指令，例如：前 3 秒产品特写，口播美式英语，突出 14 天实测数据…"
          class="min-h-24 border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
        ></Textarea>
      </div>
      <div
        class="rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-[12px] leading-relaxed text-slate-600"
      >
        <Sparkles class="mr-1.5 inline h-3.5 w-3.5 text-sky-500"></Sparkles>
        AI 将根据任务说明生成脚本与素材变体，按所选账号的时区在排期时间自动分发。
      </div>
    </Card>
    <div class="flex justify-end gap-2">
      <Button
        variant="outline"
        @click="router.push('/tasks')"
        class="border-slate-200 text-slate-500 hover:text-slate-800"
      >
        取消
      </Button>
      <Button @click="submit" class="gap-2 brand-gradient text-white hover:opacity-90">创建任务</Button>
    </div>
  </div>
</template>
