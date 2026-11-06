<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Plus,
  Sparkles,
  ArrowUp,
  Play,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  AtSign,
  Settings2,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-vue-next';
import { studio, retryGeneration } from '@/services/studio';
import ConsoleAssetPicker from '@/components/ConsoleAssetPicker.vue';
import ConsoleProductPicker from '@/components/ConsoleProductPicker.vue';
import AgentCardView from '@/components/agent/AgentCard.vue';
import VideoDetails from './VideoDetails.vue';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui';
import { videoRows, type VideoRow } from '@/services/videoManagement';
import { animateTaskTransfer } from '@/lib/animateTaskTransfer';
import { downloadFile } from '@/services/storage';
import type { AgentTask, AgentCard } from '@/types/agent';
import {
  createAgent,
  loadAgent,
  saveAgent,
  submitAgentCard,
  editAgentCard,
  regenerateAgent,
  executeAgentTask,
  tickAgent,
  sendAgent,
  addShot,
  moveShot,
  removeShot,
  saveAgentProduct,
} from '@/services/agent';
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';
import type { Asset, Product } from '@/data/mock';
import { uid, now } from '@/services/storage';
import { toast } from 'vue-sonner';
import { currentUser } from '@/services/identity';
import { saveMedia } from '@/services/media';
const props = defineProps<{ projectId: string }>();
const route = useRoute();
const router = useRouter();
const input = ref('');
const search = ref('');
const deleting = ref('');
const editTitle = ref('');
const renameId = ref('');
const seconds = ref('15');
const ratio = ref('9:16');
const outputType = ref<'视频' | '图文'>('视频');
const historyCollapsed = ref(true);
const promptInput = ref<HTMLTextAreaElement | null>(null);
function resizeInput() {
  const element = promptInput.value;
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.min(224, Math.max(64, element.scrollHeight))}px`;
}
watch(input, () => {
  void nextTick(resizeInput);
});
const picker = ref<'asset' | 'product' | null>(null);
const parametersOpen = ref(false);
function setPicker(kind: 'asset' | 'product', open: boolean) {
  if (open) {
    picker.value = kind;
    parametersOpen.value = false;
  } else if (picker.value === kind) picker.value = null;
}
const model = ref('Cinema Studio 3.5');
const quality = ref('1080P');
const audio = ref(true);
const models = ['Cinema Studio 3.5', 'Cinema Studio 3.0', 'Cinema Studio 2.5'];
const products = computed(() => studio.value.products.filter((p) => p.projectId === props.projectId));
const project = computed(() => studio.value.projects.find((p) => p.id === props.projectId));
function pickAsset(asset: Asset) {
  const session = current.value;
  if (!session) return;
  const assets = session.referenceAssets ?? [];
  if (assets.some((item) => item.id === asset.id)) {
    toast.info('该素材已添加');
    return;
  }
  if (assets.length >= 3) {
    toast.error('最多添加 3 个素材');
    return;
  }
  session.referenceAssets = [...assets, { id: asset.id, name: asset.name, type: asset.type }];
  syncAssetRequirement();
  session.updatedAt = now();
  picker.value = null;
}
function pickUploadedAsset(asset: Asset, mediaId: string) {
  const session = current.value;
  if (!session) return;
  const assets = session.referenceAssets ?? [];
  if (assets.length >= 3) {
    toast.error('最多添加 3 个素材');
    return;
  }
  if (assets.some((item) => item.id === asset.id)) return;
  session.referenceAssets = [...assets, { id: asset.id, name: asset.name, type: asset.type, mediaId }];
  syncAssetRequirement();
  session.updatedAt = now();
  picker.value = null;
  persist();
}
function syncAssetRequirement() {
  const t = agent.value;
  if (!t) return;
  t.context.referenceAssets = [...(current.value?.referenceAssets ?? [])];
  const productCard = [...t.cards].reverse().find((item) => item.module === 'product' && item.status !== 'disabled');
  if (productCard) productCard.assetAttached = !!current.value?.referenceAssets?.length;
  t.revision++;
}
function pickProduct(product: Product) {
  const session = current.value;
  if (!session) return;
  if (!session.productIds.includes(product.id)) session.productIds.push(product.id);
  const mention = `@${product.name}`;
  if (!input.value.includes(mention)) input.value = `${input.value}${input.value ? ' ' : ''}${mention}`;
  session.updatedAt = now();
  picker.value = null;
}
function removeProduct(id: string) {
  const session = current.value;
  if (!session) return;
  session.productIds = session.productIds.filter((item) => item !== id);
  const product = products.value.find((item) => item.id === id);
  if (product) input.value = input.value.replace(`@${product.name}`, '').trim();
  session.updatedAt = now();
}
const sessions = computed(() =>
  studio.value.sessions.filter(
    (s) => s.projectId === props.projectId && s.title.toLowerCase().includes(search.value.toLowerCase()),
  ),
);
const current = computed(() =>
  studio.value.sessions.find((s) => s.id === route.query.session && s.projectId === props.projectId),
);

function select(id: string) {
  void router.replace({ query: { ...route.query, session: id } });
}
function create() {
  const reference = studio.value.references.find((r) => r.id === route.query.reference);
  const product = studio.value.products.find((p) => p.id === route.query.product);
  const session = {
    id: uid(),
    projectId: props.projectId,
    title: reference ? `复刻 · ${reference.title}` : '新的创作会话',
    stage: 0,
    brief: '',
    direction: '',
    script: '',
    version: 1,
    messages: [],
    updatedAt: now(),
    reference,
    productIds: product ? [product.id] : [],
  };
  studio.value.sessions.unshift(session);
  select(session.id);
}
function latestSession() {
  return studio.value.sessions
    .filter((s) => s.projectId === props.projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}
function ensureSession() {
  const requested = typeof route.query.session === 'string' ? route.query.session : '';
  if (requested && studio.value.sessions.some((s) => s.id === requested && s.projectId === props.projectId))
    return;
  const latest = latestSession();
  if (latest) {
    select(latest.id);
    return;
  }
  create();
}
watch(() => [props.projectId, route.query.session], ensureSession, { immediate: true });
function deleteSession(id: string) {
  studio.value.sessions = studio.value.sessions.filter((session) => session.id !== id);
  deleting.value = '';
  if (route.query.session !== id) return;
  const next = latestSession();
  if (next) select(next.id);
  else create();
}
watch(
  () => current.value?.id,
  () => {
    input.value = '';
    seconds.value = current.value?.duration ?? '15';
    ratio.value = current.value?.ratio ?? '9:16';
    outputType.value = current.value?.outputType ?? '视频';
    model.value = current.value?.model ?? 'Cinema Studio 3.5';
    quality.value = current.value?.quality ?? '1080P';
    audio.value = current.value?.audio ?? true;
    parametersOpen.value = false;
    picker.value = null;
  },
  { immediate: true },
);
watch([seconds, ratio, outputType, model, quality, audio], () => {
  const s = current.value;
  if (s) {
    s.duration = seconds.value;
    s.ratio = ratio.value;
    s.outputType = outputType.value;
    s.model = model.value;
    s.quality = quality.value;
    s.audio = audio.value;
    s.updatedAt = now();
  }
});
const agent = ref<AgentTask>();
const demo = ref(false);
const savingError = ref('');
const previewImage = ref('');
const details = ref<VideoRow | null>(null);
const conversation = ref<HTMLElement | null>(null);
const nearBottom = ref(true);
const unseen = ref(false);
const cardIndexes = ref<Record<string, number>>({});
let stopTransfer: (() => void) | undefined;
let thinkingTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  if (!agent.value) return;
  try {
    saveAgent(agent.value);
    savingError.value = '';
  } catch (error) {
    savingError.value = (error as Error).message;
  }
}
watch(
  () => current.value?.id,
  () => {
    agent.value = current.value ? loadAgent(current.value) : undefined;
    demo.value = false;
  },
  { immediate: true },
);
function useDemo() {
  demo.value = true;
  input.value =
    '帮我根据这个产品生成一套适合 TikTok 美区的 UGC 带货视频，突出产品卖点，整体风格偏真实生活化。';
}
function chat() {
  const s = current.value;
  if (!s || !input.value.trim()) return;
  try {
    if (project.value?.archived) throw new Error('归档项目仅可查看');
    const text = input.value.trim();
    if (!agent.value) {
      agent.value = createAgent(s, text, demo.value, demo.value);
      s.messages.push({ role: 'user', text });
      s.title = s.title === '新的创作会话' ? text.slice(0, 24) : s.title;
    } else {
      agent.value.thinkingUntil = Date.now() + 3000;
      persist();
      clearTimeout(thinkingTimer);
      thinkingTimer = setTimeout(() => {
        if (!agent.value || !current.value) return;
        sendAgent(agent.value, current.value, text);
        agent.value.thinkingUntil = undefined;
        current.value.updatedAt = now();
        persist();
      }, 3000);
    }
    s.updatedAt = now();
    persist();
    input.value = '';
    nearBottom.value = true;
    scrollLatest();
  } catch (error) {
    toast.error((error as Error).message);
  }
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chat();
  }
}
function scrollLatest() {
  void nextTick(() => {
    const el = conversation.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
      unseen.value = false;
    }
  });
}
watch(
  () => agent.value?.messages.length,
  () => {
    if (nearBottom.value) scrollLatest();
    else unseen.value = true;
  },
);
function onScroll() {
  const el = conversation.value;
  if (el) nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
}
const scriptDialog = ref(false);
const scriptIndex = ref(0);
const scriptCards = computed(() => agent.value?.cards.filter(c => c.module.startsWith('shot-') && c.status !== 'disabled') ?? []);
function displayCardIds(message: AgentTask['messages'][number]) {
  return message.cardIds.filter(id => !agent.value?.cards.find(c => c.id === id)?.module.startsWith('shot-'));
}
function visibleCardId(message: AgentTask['messages'][number]) {
  const ids = displayCardIds(message).filter((id) => agent.value?.cards.some((c) => c.id === id));
  const index = Math.min(agent.value?.activeCards?.[message.id] ?? cardIndexes.value[message.id] ?? 0, Math.max(0, ids.length - 1));
  return ids[index];
}
function shiftCard(message: AgentTask['messages'][number], delta: number) {
  const total = displayCardIds(message).length;
  const currentIndex = agent.value?.activeCards?.[message.id] ?? cardIndexes.value[message.id] ?? 0;
  cardIndexes.value = { ...cardIndexes.value, [message.id]: Math.max(0, Math.min(total - 1, currentIndex + delta)) };
  if (agent.value) agent.value.activeCards = { ...agent.value.activeCards, ...cardIndexes.value };
  persist();
}
async function uploadProductImage(c: AgentCard, file: File) {
  const t = agent.value;
  const s = current.value;
  const owner = currentUser.value?.id;
  if (!t || !s || !owner || project.value?.archived) return;
  if (!file.type.startsWith('image/')) { toast.error('请上传图片文件'); return; }
  try {
    const mediaId = await saveMedia(owner, file);
    c.imageMediaId = mediaId;
    c.imageName = file.name;
    s.referenceAssets = [...(s.referenceAssets ?? []).filter(a => a.id !== `product-${t.id}`), { id: `product-${t.id}`, name: file.name, type: '图片', mediaId }];
    t.context.referenceAssets = [...s.referenceAssets];
    saveAgent(t);
  } catch (error) { toast.error((error as Error).message); }
}
function action(c: AgentCard, name: string, index?: number) {
  const t = agent.value,
    s = current.value;
  if (!t || !s) return;
  try {
    if (name === 'upload-asset') {
      picker.value = 'asset';
      return;
    }
    if (name === 'save-product') {
      saveAgentProduct(t, c, s);
      toast.success('已保存为当前项目的产品卡');
    }
    if (name === 'remove-image') {
      delete c.imageMediaId; delete c.imageName;
      s.referenceAssets = s.referenceAssets?.filter(a => a.id !== `product-${t.id}`);
      t.context.referenceAssets = [...(s.referenceAssets ?? [])];
    }
    if (name === 'edit-script') { editAgentCard(t, c); c.editingContent = true; }
    if (name === 'save-script') { c.editingContent = false; c.editing = false; }

    if (name === 'submit') {
      submitAgentCard(t, c, s);
      if (c.module === 'intent-style' || c.module === 'intent-market') {
        const message = t.messages.find(m => m.cardIds.includes(c.id));
        if (message) shiftCard(message, 1);
      }
      if (c.module === 'render' && c.status === 'submitted') {
        const source = document.querySelector<HTMLElement>(`[data-agent-card="form"] .studio-primary`);
        const target = document.querySelector<HTMLElement>('[data-video-management]');
        if (source && target) {
          stopTransfer?.();
          stopTransfer = animateTaskTransfer(source, target);
        }
      }
    }
    if (name === 'edit') editAgentCard(t, c);
    if (name === 'regenerate') regenerateAgent(t, c, index);
    if (name === 'execute') executeAgentTask(t, c);
    if (name === 'add-shot') addShot(t, c);
    if (name === 'move') moveShot(t, c, index ?? 1);
    if (name === 'remove-shot') removeShot(t, c);
    const content = c.fields.map((f) => `${f.label}：${f.value}`).join('\n');
    if (name === 'copy')
      void navigator.clipboard
        .writeText(content)
        .then(() => toast.success('已复制'))
        .catch(() => toast.error('复制失败'));
    if (name === 'download') {
      const isShot = c.module.startsWith('shot-');
      const body = isShot
        ? `镜头编号,版本,预计时长,关联卖点,画面与动作,英文口播,字幕,参考图,关键帧提示词,视频提示词,验收标准\n${c.title},${c.fields.map((f) => `"${f.value.replace(/"/g, '""')}"`).join(',')}`
        : content;
      downloadFile(`${c.title}-${isShot ? '分镜.csv' : '演示方案.txt'}`, new Blob([body], { type: isShot ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
    }
    persist();
  } catch (error) {
    toast.error((error as Error).message);
  }
}
const timer = window.setInterval(() => {
  if (agent.value && current.value && tickAgent(agent.value, current.value)) persist();
}, 250);
onBeforeUnmount(() => {
  clearInterval(timer);
  clearTimeout(thinkingTimer);
  stopTransfer?.();
});
function jobs(c: AgentCard) {
  return (c.jobIds ?? []).map((id) => ({
    id,
    job: studio.value.jobs.find((j) => j.id === id),
    film: studio.value.films.find((f) => f.id === id),
  }));
}
function openResult(id: string) {
  details.value =
    videoRows(studio.value, props.projectId, false).find(
      (row) => row.film?.id === id || row.job?.id === id,
    ) ?? null;
}
function retryJob(id: string) {
  if (project.value?.archived) return;
  retryGeneration(id);
}
</script>
<template>
  <div class="flex min-h-[560px] overflow-hidden bg-white" :class="agent && 'h-[calc(100dvh-100px)]'">
    <main class="relative flex min-w-0 flex-1 flex-col">
      <template v-if="current">
        <div
          v-if="agent"
          ref="conversation"
          role="log"
          aria-label="Agent 创作对话"
          class="expert-conversation min-h-0 flex-1 overflow-y-auto px-6 py-4"
          @scroll="onScroll"
        >
          <div class="mx-auto max-w-[1000px]">
            <div class="mb-4 flex items-center justify-between py-1 text-xs text-slate-500">
              <h1 class="text-base font-semibold text-slate-800">专家模式</h1>
              <span>当前阶段：{{ agent.stage }} · {{ agent.context.style }}</span>
            </div>
            <article
              v-for="message in agent.messages"
              :key="message.id"
              class="mb-4"
              :class="message.role === 'user' ? 'flex flex-col items-end' : ''"
            >
              <p
                v-if="message.text"
                class="max-w-[95%] whitespace-pre-wrap text-[13px] leading-6"
                :class="
                  message.role === 'user'
                    ? 'rounded-2xl rounded-br-md bg-sky-500 px-4 py-3 text-white'
                    : 'py-1 text-slate-600'
                "
              >
                {{ message.text }}
              </p>
              <div v-if="message.cardIds.length" class="rounded-2xl border border-sky-100 bg-sky-50/50 p-2">
              <div v-if="displayCardIds(message).length > 1" class="mb-2 flex items-center justify-between px-2 text-xs text-slate-500">
                <span>交互步骤</span>
                <div class="flex items-center gap-2">
                  <button type="button" class="rounded-full p-1 hover:bg-white disabled:opacity-30" :disabled="(agent.activeCards?.[message.id] ?? cardIndexes[message.id] ?? 0) === 0" @click="shiftCard(message, -1)"><ChevronLeft class="h-4 w-4" /></button>
                  <span>{{ (agent.activeCards?.[message.id] ?? cardIndexes[message.id] ?? 0) + 1 }}/{{ displayCardIds(message).length }}</span>
                  <button type="button" class="rounded-full p-1 hover:bg-white disabled:opacity-30" :disabled="(agent.activeCards?.[message.id] ?? cardIndexes[message.id] ?? 0) >= displayCardIds(message).length - 1" @click="shiftCard(message, 1)"><ChevronRight class="h-4 w-4" /></button>
                </div>
              </div>
              <button v-if="message.cardIds.some(id => agent!.cards.find(c => c.id === id)?.module.startsWith('shot-'))" class="studio-btn m-2" @click="scriptDialog = true">查看 / 修改视频脚本</button>
              <template v-for="id in [visibleCardId(message)]" :key="id">
                <AgentCardView
                  v-if="agent.cards.find((c) => c.id === id)"
                  :card="agent.cards.find((c) => c.id === id)!"
                  :readonly="project?.archived"
                  :structured="agent.flow === 'intent-product-script'"
                  @upload="uploadProductImage(agent!.cards.find(c => c.id === id)!, $event)"
                  @action="
                    (name, index) =>
                      action(
                        agent!.cards.find((c) => c.id === id)!,
                        name,
                        index,
                      )
                  "
                  @preview="previewImage = $event"
                >
                  <template v-if="agent.cards.find((c) => c.id === id)?.module === 'video-result'">
                    <div
                      v-for="result in jobs(agent.cards.find((c) => c.id === id)!)"
                      :key="result.id"
                      class="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3"
                    >
                      <img
                        src="/agent-product.svg"
                        alt="演示作品封面"
                        class="h-16 w-24 rounded object-cover"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-medium">
                          {{ result.film?.title ?? result.job?.film.title ?? '作品已删除' }}
                        </p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{
                            result.film
                              ? '生成成功'
                              : result.job?.status === '等待中'
                                ? '生成中'
                                : (result.job?.status ?? '记录不存在')
                          }}
                        </p>
                      </div>
                      <button
                        v-if="result.film || result.job"
                        class="text-xs text-sky-600"
                        @click="openResult(result.id)"
                      >
                        查看详情
                      </button>
                      <button
                        v-if="result.job?.status === '生成失败' && !project?.archived"
                        class="text-xs text-sky-600"
                        @click="retryJob(result.id)"
                      >
                        重试生成
                      </button>
                    </div>
                  </template>
                </AgentCardView>
              </template>
              </div>
            </article>
            <div
              v-if="agent.thinkingUntil"
              class="mb-4 flex items-center gap-2 text-xs text-slate-400"
              aria-label="AI 正在思考"
            >
              <span class="flex gap-1" aria-hidden="true"><i class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" /><i class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400 [animation-delay:150ms]" /><i class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400 [animation-delay:300ms]" /></span>
              AI 正在思考…
            </div>
          </div>
        </div>
        <div v-else class="flex-1" />
        <button
          v-if="agent && unseen"
          class="mx-auto rounded-full bg-sky-50 px-4 py-1 text-xs text-sky-600"
          @click="
            nearBottom = true;
            scrollLatest();
          "
        >
          有新消息 · 查看最新
        </button>
        <div
          class="mx-auto w-full max-w-[1200px] shrink-0 px-6 pb-3"
          :class="agent && 'border-t border-slate-100 bg-white pt-2'"
        >
          <p v-if="savingError" role="alert" class="text-xs text-rose-500">
            {{ savingError }}
            <button @click="persist">重试保存</button>
          </p>
          <section class="pt-3">
            <header v-if="!agent" class="mb-5 text-center">
              <h1 class="mb-2 text-2xl font-semibold brand-text">让每一条视频，都更懂用户</h1>
              <p class="mx-auto max-w-3xl text-sm leading-6 text-slate-400">
                开启深度思考，通过 Agent
                多轮对话深入分析产品卖点与用户痛点，持续优化创意、脚本及分镜方案，打造更专业、更具说服力的视频内容。
              </p>
            </header>
            <button v-if="!agent" class="mb-4 block w-full text-center text-xs text-sky-600" @click="useDemo">
              体验产品 UGC 创作案例
            </button>
            <div class="relative isolate">
              <div
                aria-hidden="true"
                v-if="!agent"
                class="pointer-events-none absolute -inset-2 -z-10 rounded-[30px] bg-gradient-to-r from-sky-200/60 via-blue-100/40 to-blue-300/50 blur-xl"
              />
              <div class="rounded-[25px] bg-gradient-to-br from-sky-200 via-slate-100 to-blue-200 p-px">
                <form class="w-full rounded-[24px] bg-white p-4 shadow-sm sm:p-5" @submit.prevent="chat">
                  <div class="flex items-start gap-3 sm:gap-5">
                    <div class="min-w-0 flex-1">
                      <div
                        v-if="current.referenceAssets?.length || current.productIds.length"
                        class="mb-3 flex flex-wrap gap-2"
                        aria-label="创作引用"
                      >
                        <div
                          v-for="asset in current.referenceAssets"
                          :key="asset.id"
                          class="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
                          data-testid="expert-asset-chip"
                        >
                          <span
                            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600"
                          >
                            <Play
                              v-if="asset.type === '视频'"
                              class="h-3.5 w-3.5 translate-x-px"
                              fill="currentColor"
                            />
                            <ImageIcon v-else class="h-3.5 w-3.5" />
                          </span>
                          <span
                            class="min-w-0 max-w-48 truncate text-xs font-medium text-slate-700"
                            :title="asset.name"
                          >
                            {{ asset.name.replace(/\.[^.]+$/, '').slice(0, 18)
                            }}{{ asset.name.replace(/\.[^.]+$/, '').length > 18 ? '…' : '' }}
                          </span>
                          <button
                            type="button"
                            class="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            :aria-label="`移除素材 ${asset.name}`"
                            @click="
                              current.referenceAssets = current.referenceAssets?.filter(
                                (item) => item.id !== asset.id,
                              )
                            "
                          >
                            <X class="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span
                          v-for="product in products.filter((item) => current?.productIds.includes(item.id))"
                          :key="product.id"
                          class="inline-flex max-w-[200px] items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-600"
                          data-testid="expert-product-chip"
                        >
                          <AtSign class="h-3.5 w-3.5 shrink-0" />
                          <span class="truncate">{{ product.name }}</span>
                          <button
                            type="button"
                            class="rounded p-0.5 text-sky-400 transition hover:bg-sky-100 hover:text-sky-700"
                            :aria-label="`移除产品卡 ${product.name}`"
                            @click="removeProduct(product.id)"
                          >
                            <X class="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                      <textarea
                        ref="promptInput"
                        v-model="input"
                        aria-label="专家对话"
                        class="block h-16 max-h-56 min-h-16 w-full resize-none overflow-y-auto border-0 bg-transparent px-1 py-2 text-sm leading-7 outline-none placeholder:text-slate-400 focus:ring-0"
                        placeholder="上传产品资料，或描述你想创作的视频内容……"
                        @input="resizeInput"
                        @keydown="keydown"
                      />
                    </div>
                  </div>
                  <div class="mt-4 flex items-end justify-between gap-3" data-testid="expert-toolbar">
                    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <PopoverRoot
                        v-for="kind in ['asset', 'product'] as const"
                        :key="kind"
                        :open="picker === kind"
                        @update:open="setPicker(kind, $event)"
                      >
                        <PopoverTrigger as-child>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                            :class="picker === kind && 'border-sky-300 bg-sky-50 text-sky-600'"
                          >
                            <FolderOpen v-if="kind === 'asset'" class="h-3.5 w-3.5" />
                            <AtSign v-else class="h-3.5 w-3.5" />
                            {{ kind === 'asset' ? '素材库' : '产品卡' }}
                          </button>
                        </PopoverTrigger>
                        <PopoverPortal>
                          <PopoverContent
                            side="top"
                            align="start"
                            :side-offset="8"
                            :collision-padding="16"
                            class="z-[80] max-h-[min(560px,var(--reka-popover-content-available-height))] max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl outline-none"
                            :class="kind === 'asset' ? 'w-[540px]' : 'w-[380px]'"
                            :aria-label="kind === 'asset' ? '选择参考素材' : '选择产品卡'"
                          >
                            <ConsoleAssetPicker
                              v-if="kind === 'asset'"
                              :project-name="project?.name"
                              @pick="pickAsset"
                              @upload="pickUploadedAsset"
                            />
                            <ConsoleProductPicker v-else :products="products" @pick="pickProduct" />
                          </PopoverContent>
                        </PopoverPortal>
                      </PopoverRoot>
                      <PopoverRoot v-model:open="parametersOpen" @update:open="$event && (picker = null)">
                        <PopoverTrigger as-child>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                            aria-controls="expert-video-parameters"
                          >
                            <Settings2 class="h-3.5 w-3.5" />
                            视频参数设置
                            <ChevronRight class="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverPortal>
                          <PopoverContent
                            side="top"
                            align="start"
                            :side-offset="10"
                            :collision-padding="16"
                            class="z-[80] w-[540px] max-w-[calc(100vw-32px)] max-h-[var(--reka-popover-content-available-height)] overflow-y-auto rounded-2xl outline-none"
                            aria-label="视频参数面板"
                          >
                            <section
                              id="expert-video-parameters"
                              aria-label="视频参数设置"
                              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
                            >
                              <div class="mb-3 flex items-center justify-between">
                                <h2 class="text-sm font-medium text-slate-700">视频参数设置</h2>
                                <button
                                  type="button"
                                  aria-label="收起视频参数"
                                  class="text-slate-400"
                                  @click="parametersOpen = false"
                                >
                                  <X class="h-4 w-4" />
                                </button>
                              </div>
                              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <label>
                                  <span class="studio-label">模型</span>
                                  <select v-model="model" aria-label="模型" class="studio-field">
                                    <option v-for="name in models" :key="name">{{ name }}</option>
                                  </select>
                                </label>
                                <label>
                                  <span class="studio-label">分辨率</span>
                                  <select v-model="quality" aria-label="分辨率" class="studio-field">
                                    <option v-for="value in ['480', '720', '1080P', '4K']" :key="value">
                                      {{ value }}
                                    </option>
                                  </select>
                                </label>
                                <label>
                                  <span class="studio-label">比例</span>
                                  <select v-model="ratio" aria-label="比例" class="studio-field">
                                    <option
                                      v-for="value in ['9:16', '16:9', '4:3', '1:1', '4:5']"
                                      :key="value"
                                    >
                                      {{ value }}
                                    </option>
                                  </select>
                                </label>
                                <label>
                                  <span class="studio-label">输出类型</span>
                                  <select v-model="outputType" aria-label="输出类型" class="studio-field">
                                    <option>视频</option>
                                    <option>图文</option>
                                  </select>
                                </label>
                                <label v-if="outputType === '视频'">
                                  <span class="studio-label">时长</span>
                                  <select v-model="seconds" aria-label="时长" class="studio-field">
                                    <option v-for="value in ['15', '30', '60']" :key="value" :value="value">
                                      {{ value }} 秒
                                    </option>
                                  </select>
                                </label>
                                <label
                                  v-if="outputType === '视频'"
                                  class="flex items-center gap-2 self-end pb-3 text-xs text-slate-600"
                                >
                                  <input v-model="audio" type="checkbox" class="accent-sky-500" />
                                  生成音频
                                </label>
                              </div>
                              <p class="mt-3 text-xs text-slate-400">
                                参数为可选设置，使用默认参数也可直接创作。
                              </p>
                            </section>
                          </PopoverContent>
                        </PopoverPortal>
                      </PopoverRoot>
                    </div>
                    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span
                        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-sky-100 bg-sky-50/70 px-2.5 py-1.5 text-xs font-medium text-sky-700"
                        data-testid="expert-mode-label"
                        title="通过深度思考与多轮对话，打磨创意、脚本与分镜"
                      >
                        <Sparkles class="h-3.5 w-3.5" />
                        专家模式
                      </span>
                      <button
                        class="brand-gradient grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm shadow-sky-200 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="发送消息"
                        :disabled="!input.trim()"
                      >
                        <ArrowUp class="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <p class="mt-2 pr-1 text-right text-xs text-slate-400" data-testid="expert-credit-hint">
              聊天不消耗积分
            </p>
          </section>
        </div>
      </template>
      <div v-else class="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <MessageSquare class="mb-4 h-9 w-9 text-sky-300" />
        <h3 class="text-base font-semibold text-slate-700">好创意，从对话开始</h3>
        <p class="my-3 text-sm text-slate-400">需求澄清 · 创意选择 · 脚本确认 · 生成成片</p>
        <button class="studio-primary" @click="create">
          <Plus class="h-4 w-4" />
          新建会话
        </button>
      </div>
    </main>

    <Dialog :open="scriptDialog" @update:open="scriptDialog = $event">
      <DialogContent class="max-h-[85vh] max-w-4xl overflow-y-auto bg-white">
        <DialogTitle>第三轮 · 视频脚本与分镜</DialogTitle>
        <div class="flex items-center justify-between gap-3">
          <button class="studio-btn" :disabled="scriptIndex === 0" @click="scriptIndex--">上一镜</button>
          <span class="text-sm text-slate-500">{{ scriptIndex + 1 }} / {{ scriptCards.length }}</span>
          <button class="studio-btn" :disabled="scriptIndex >= scriptCards.length - 1" @click="scriptIndex++">下一镜</button>
        </div>
        <AgentCardView v-if="scriptCards[scriptIndex]" :key="scriptCards[scriptIndex]!.id" :card="scriptCards[scriptIndex]!" structured :readonly="project?.archived" @action="(name, index) => action(scriptCards[scriptIndex]!, name, index)" />
      </DialogContent>
    </Dialog>
    <VideoDetails :row="details" @close="details = null" />
    <Dialog :open="!!previewImage" @update:open="!$event && (previewImage = '')">
      <DialogContent class="max-w-3xl bg-white">
        <DialogTitle>图片预览（Mock）</DialogTitle>
        <img :src="previewImage" alt="放大预览" class="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
    <aside
      class="shrink-0 overflow-hidden border-l border-slate-100 transition-[width] duration-200"
      :class="historyCollapsed ? 'w-12' : 'w-60 xl:w-64'"
      aria-label="历史会话侧边栏"
    >
      <div class="flex h-full flex-col p-2">
        <div class="flex shrink-0 flex-col items-center gap-2">
          <button
            class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-600"
            :aria-label="historyCollapsed ? '展开历史会话' : '收起历史会话'"
            :title="historyCollapsed ? '展开历史会话' : '收起历史会话'"
            @click="historyCollapsed = !historyCollapsed"
          >
            <PanelLeftOpen v-if="historyCollapsed" class="h-4 w-4" />
            <PanelLeftClose v-else class="h-4 w-4" />
          </button>
          <button
            class="flex h-7 items-center justify-center gap-1 rounded-lg text-sky-600 hover:bg-sky-50"
            :class="historyCollapsed ? 'w-7 shrink-0' : 'w-full'"
            :aria-label="historyCollapsed ? '新建会话' : undefined"
            :title="historyCollapsed ? '新建会话' : undefined"
            @click="create"
          >
            <Plus class="h-4 w-4" />
            <span v-if="!historyCollapsed" class="text-xs font-medium">新建会话</span>
          </button>
        </div>
        <template v-if="!historyCollapsed">
          <input
            v-model="search"
            class="my-3 h-9 w-full rounded-lg bg-slate-50 px-3 text-xs outline-none focus:ring-1 focus:ring-sky-300"
            placeholder="搜索历史会话"
            aria-label="搜索历史会话"
          />
          <div class="mb-2 px-2 text-[11px] text-slate-400">历史会话 · 当前项目</div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div
              v-for="s in sessions"
              :key="s.id"
              class="group mb-1 rounded-lg px-2 py-2"
              :class="s.id === current?.id ? 'bg-sky-50' : 'hover:bg-slate-50'"
            >
              <button class="w-full truncate text-left text-xs text-slate-700" @click="select(s.id)">
                {{ s.title }}
              </button>
              <div class="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                <span class="flex-1">{{ new Date(s.updatedAt).toLocaleDateString() }}</span>
                <button
                  aria-label="重命名会话"
                  title="重命名"
                  @click="
                    renameId = s.id;
                    editTitle = s.title;
                  "
                >
                  <Pencil class="h-3 w-3" />
                </button>
                <button aria-label="删除会话" title="删除" @click="deleting = s.id">
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
              <div v-if="renameId === s.id" class="mt-2">
                <input
                  v-model="editTitle"
                  class="h-8 w-full rounded-md bg-white px-2 text-xs outline-none ring-1 ring-slate-200"
                  @keydown.enter="
                    s.title = editTitle.trim() || s.title;
                    renameId = '';
                  "
                />
                <button
                  class="mt-2 text-xs text-sky-600"
                  @click="
                    s.title = editTitle.trim() || s.title;
                    renameId = '';
                  "
                >
                  保存名称
                </button>
              </div>
              <div v-if="deleting === s.id" class="mt-2 text-xs">
                <p class="mb-2 text-rose-500">删除此会话？成片仍保留。</p>
                <button class="mr-3 text-rose-500" @click="deleteSession(s.id)">删除</button>
                <button @click="deleting = ''">取消</button>
              </div>
            </div>
            <p v-if="!sessions.length" class="px-2 py-8 text-center text-xs text-slate-400">暂无历史会话</p>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.expert-conversation {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.expert-conversation::-webkit-scrollbar {
  display: none;
}
</style>
