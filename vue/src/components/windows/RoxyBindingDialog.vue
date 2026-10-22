<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription, Input } from '@/components/ui';
import { roxyProjects, demoWindows } from '@/data/windowDemo';
import { useWindowManager } from '@/composables/useWindowManager';
import { useDemoTimers } from '@/composables/useDemoTimers';

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ startAt: 'key' | 'projects' }>();
const manager = useWindowManager();
const { repeat, cancelRepeat } = useDemoTimers();
const stage = ref<'key' | 'projects' | 'running' | 'done'>('key');
const apiKey = ref('');
const error = ref('');
const selected = ref<string[]>([]);
const progress = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
const stages = ['获取项目窗口', '识别平台登录状态', '汇总视频表现'];
const selectedWindowCount = computed(
  () => demoWindows.filter((w) => selected.value.includes(w.roxyProjectId)).length,
);
const heading = computed(
  () =>
    ({ key: '绑定 RoxyBrowser', projects: '选择同步项目', running: '正在同步窗口', done: '同步完成' })[
      stage.value
    ],
);

function stop() {
  if (timer !== undefined) {
    cancelRepeat(timer);
    timer = undefined;
  }
}
watch(open, (value) => {
  stop();
  apiKey.value = '';
  error.value = '';
  if (!value) return;
  stage.value = props.startAt;
  selected.value = [...manager.selectedProjectIds.value];
  progress.value = 0;
});
function connect() {
  if (!apiKey.value.trim()) {
    error.value = '请输入 API Key，或使用演示 Key';
    return;
  }
  apiKey.value = '';
  error.value = '';
  stage.value = 'projects';
}
function start() {
  if (!selected.value.length) {
    error.value = '至少选择一个项目';
    return;
  }
  error.value = '';
  stage.value = 'running';
  progress.value = 0;
  timer = repeat(() => {
    progress.value += 10;
    if (progress.value < 100) return;
    stop();
    manager.synchronize(selected.value);
    stage.value = 'done';
  }, 220);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-xl rounded-2xl border-slate-200 bg-white p-7">
      <div>
        <div
          class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600"
        >
          <ShieldCheck class="h-3.5 w-3.5" />
          RoxyBrowser · 演示连接
        </div>
        <DialogTitle class="text-xl text-slate-900">{{ heading }}</DialogTitle>
        <DialogDescription class="mt-2 text-[13px] leading-6 text-slate-500">
          一个窗口，多平台账号。同步窗口后，统一查看内容表现。
        </DialogDescription>
      </div>
      <ol class="flex items-center gap-2 text-[11px] text-slate-400" aria-label="绑定步骤">
        <li :class="stage === 'key' ? 'text-sky-600' : ''">01 绑定浏览器</li>
        <li class="h-px flex-1 bg-slate-100" />
        <li :class="stage === 'projects' ? 'text-sky-600' : ''">02 选择项目</li>
        <li class="h-px flex-1 bg-slate-100" />
        <li :class="stage === 'running' || stage === 'done' ? 'text-sky-600' : ''">03 同步完成</li>
      </ol>
      <form v-if="stage === 'key'" class="space-y-4 pt-2" @submit.prevent="connect">
        <div class="space-y-2">
          <label for="roxy-key" class="text-[13px] font-medium text-slate-700">
            本地 RoxyBrowser API Key
          </label>
          <Input
            id="roxy-key"
            v-model="apiKey"
            type="password"
            autocomplete="off"
            placeholder="输入 API Key"
            class="border-slate-200 text-[13px]"
          />
          <p class="text-[12px] text-slate-400">当前为演示模式，使用示例 Key 即可体验，无需启动浏览器。</p>
          <button
            type="button"
            class="text-[12px] font-medium text-sky-600 hover:text-sky-700"
            @click="
              apiKey = 'roxy-demo-local-key';
              error = '';
            "
          >
            一键填入演示 Key
          </button>
        </div>
        <p v-if="error" role="alert" class="text-[12px] text-rose-600">{{ error }}</p>
        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" @click="open = false">取消</Button>
          <Button type="submit" class="brand-gradient text-white">同步账号</Button>
        </div>
      </form>
      <div v-else-if="stage === 'projects'" class="space-y-4">
        <div class="flex items-center justify-between text-[12px] text-slate-500">
          <span>已选 {{ selected.length }} 个项目 · {{ selectedWindowCount }} 个窗口</span>
          <button
            class="text-sky-600"
            @click="selected = selected.length === roxyProjects.length ? [] : roxyProjects.map((p) => p.id)"
          >
            {{ selected.length === roxyProjects.length ? '取消全选' : '全选项目' }}
          </button>
        </div>
        <div class="max-h-[38vh] space-y-2 overflow-y-auto">
          <label
            v-for="project in roxyProjects"
            :key="project.id"
            class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
            :class="
              selected.includes(project.id)
                ? 'border-sky-300 bg-sky-50/60'
                : 'border-slate-200 hover:bg-slate-50'
            "
          >
            <input
              v-model="selected"
              type="checkbox"
              :value="project.id"
              class="h-4 w-4 accent-sky-500"
              :aria-label="project.name"
            />
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] font-medium text-slate-700">{{ project.name }}</span>
              <span class="mt-1 block text-[11px] text-slate-400">已关联同名工作台项目</span>
            </span>
            <span class="text-[12px] text-slate-500">
              {{ demoWindows.filter((w) => w.roxyProjectId === project.id).length }} 个窗口
            </span>
          </label>
        </div>
        <p class="text-[11px] leading-5 text-slate-400">
          仅保留本次勾选项目的同步数据。窗口中的账号根据模拟登录状态识别。
        </p>
        <p v-if="error" role="alert" class="text-[12px] text-rose-600">{{ error }}</p>
        <div class="flex justify-between border-t border-slate-100 pt-4">
          <Button variant="ghost" @click="stage = 'key'">返回绑定</Button>
          <div class="flex gap-2">
            <Button variant="outline" @click="open = false">取消</Button>
            <Button class="brand-gradient text-white" @click="start">开始同步</Button>
          </div>
        </div>
      </div>
      <div v-else-if="stage === 'running'" class="space-y-6 py-3" aria-live="polite">
        <div class="flex items-center gap-3">
          <RefreshCw class="h-5 w-5 animate-spin text-sky-500" />
          <span class="flex-1 text-sm font-medium text-slate-700">
            {{ stages[Math.min(2, Math.floor(progress / 34))] }}
          </span>
          <span class="text-sm tabular-nums text-sky-600">{{ progress }}%</span>
        </div>
        <div
          class="h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="同步进度"
        >
          <div class="brand-gradient h-full transition-all duration-200" :style="{ width: `${progress}%` }" />
        </div>
        <div class="space-y-3">
          <div
            v-for="(name, index) in stages"
            :key="name"
            class="flex items-center gap-2 text-[12px]"
            :class="progress >= index * 34 ? 'text-slate-600' : 'text-slate-300'"
          >
            <Check
              class="h-3.5 w-3.5"
              :class="progress >= (index + 1) * 33 ? 'text-emerald-500' : 'text-slate-300'"
            />
            {{ name }}
          </div>
        </div>
        <Button variant="outline" class="w-full" @click="open = false">取消同步</Button>
      </div>
      <div v-else class="space-y-5 py-2 text-center" aria-live="polite">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"
        >
          <Check class="h-7 w-7" />
        </div>
        <p class="text-sm text-slate-600">窗口和平台账号已同步，可以开始查看内容表现。</p>
        <div class="grid grid-cols-3 rounded-xl bg-slate-50 py-5">
          <div
            v-for="item in [
              { label: '项目', value: manager.selectedProjectIds.value.length },
              { label: '窗口', value: manager.windows.value.length },
              { label: '已识别账号', value: manager.accounts.value.length },
            ]"
            :key="item.label"
          >
            <div class="text-2xl font-semibold text-slate-800">{{ item.value }}</div>
            <div class="mt-1 text-[11px] text-slate-400">{{ item.label }}</div>
          </div>
        </div>
        <p class="text-[12px] text-slate-400">
          {{
            manager.accounts.value.filter((a) => a.status === '登录失效').length
          }}
          个账号登录失效，可在窗口详情中演示恢复登录。
        </p>
        <Button class="brand-gradient w-full text-white" @click="open = false">进入窗口管理</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
