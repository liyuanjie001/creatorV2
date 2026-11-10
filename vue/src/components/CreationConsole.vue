<script setup lang="ts">
import type { ConsoleDraft } from '@/types/domain';
import { useDemoTimers } from '@/composables/useDemoTimers';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  AtSign,
  FolderOpen,
  Monitor,
  RectangleHorizontal,
  Clock,
  Volume2,
  Minus,
  Plus,
  Clapperboard,
  Image as ImageIcon,
  Wand2,
  ChevronRight,
  Check,
  AudioWaveform,
  FolderPlus,
  ChevronDown,
  X,
  Play,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import ConsoleAssetPicker from '@/components/ConsoleAssetPicker.vue';
import ConsoleProductPicker from '@/components/ConsoleProductPicker.vue';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { animateTaskTransfer } from '@/lib/animateTaskTransfer';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { studio, startGeneration, startBreakdown, blankAttributes } from '@/services/studio';
import { currentUser } from '@/services/identity';
import { saveMedia, getMedia } from '@/services/media';
import { uid } from '@/services/storage';
import { mockBreakdown, breakdownText } from '@/services/breakdown';
import { products, projects, type Asset, type Product } from '@/data/mock';
import { useOptionalProjectWorkspace } from '@/composables/useProjectWorkspace';
import { REMAKE_PROMPT, useRemakeDraft } from '@/composables/useRemakeDraft';

type MenuKey = 'asset' | 'product' | 'engine' | 'quality' | 'ratio' | null;

const consoleDraftPool: ConsoleDraft[] = [
  { platform: 'TikTok', title: '3 秒开箱：把期待感拉满的悬念开头', tag: '悬念钩子' },
  { platform: 'Instagram', title: 'Before / After 对比图文', tag: '转化导向' },
  { platform: 'YouTube', title: '深度测评长视频 + 章节导航', tag: 'SEO 关键词' },
  { platform: 'TikTok', title: '反差剧情：办公室好物脑洞用法', tag: '剧情反转' },
  { platform: 'X', title: 'Thread 长帖：5 个使用场景串讲', tag: '场景营销' },
  { platform: 'Instagram', title: 'UGC 感生活 vlog 切片', tag: '软植入' },
];

const engines = [
  { name: 'Cinema Studio 3.5', desc: '相机选择、风格预设和 AI 导演' },
  { name: 'Cinema Studio 3.0', desc: '增强的运镜和变速控制' },
  { name: 'Cinema Studio 2.5', desc: '支持首帧的运镜' },
] as const;

const qualityOptions = ['480', '720', '1080P', '4K'] as const;
const ratioOptions = ['9:16', '16:9', '4:3', '1:1', '4:5'] as const;

const { delay } = useDemoTimers();
const { placeholder, className, projectId, spacious, quickActions } = defineProps<{
  placeholder?: string;
  className?: string;
  projectId?: string;
  spacious?: boolean;
  quickActions?: boolean;
}>();
const emit = defineEmits<{
  start: [];
  done: [items: ConsoleDraft[]];
}>();

const router = useRouter();
const creationRoute = useRoute();
const mode = ref<'视频' | '图文'>('视频');
const brief = ref('');
const inputExpanded = ref(false);
function toggleInputSize() {
  inputExpanded.value = !inputExpanded.value;
  void nextTick(() => consoleRoot.value?.querySelector('textarea')?.focus());
}
const engine = ref(0);
const quality = ref<(typeof qualityOptions)[number]>('480');
const ratio = ref<(typeof ratioOptions)[number]>('9:16');
const duration = ref('15');
const audio = ref(true);
const batch = ref(1);
const generating = ref(false);
const generateButton = ref<HTMLButtonElement | null>(null);
let stopTaskTransfer: (() => void) | undefined;
const draftIdx = ref(0);
const menu = ref<MenuKey>(null);
const menuStyle = ref<Record<string, string>>({});
const consoleRoot = ref<HTMLElement | null>(null);
const assetBtn = ref<HTMLElement | null>(null);
const productBtn = ref<HTMLElement | null>(null);
const engineBtn = ref<HTMLElement | null>(null);
const qualityBtn = ref<HTMLElement | null>(null);
const ratioBtn = ref<HTMLElement | null>(null);
const workspace = useOptionalProjectWorkspace();
const { remakeRef, remakeBrief, remakeNonce, takeBrief, clearReference } = useRemakeDraft();
const referenceVideo = remakeRef;
const selectedAssets = ref<Asset[]>([]);
const selectedLocalImageRefs = ref<{ id: string; name: string; type: string; mediaId: string }[]>([]);
const selectedProducts = ref<Product[]>([]);
type QuickAction = '拆解视频脚本' | '修改视频' | '爆款视频复刻';
const selectedQuickAction = ref<QuickAction | null>(null);
const videoSourceOpen = ref(false);
const videoLink = ref('');
const videoSourceError = ref('');
const videoUploading = ref(false);
const editingVideoMedia = ref<{ id: string; name: string; type: string; mediaId: string }[]>([]);
const localVideo = ref<{ id: string; name: string; type: string; mediaId: string } | null>(null);
const targetPreview = ref('');
const targetPreviewFailed = ref(false);
let previewRevision = 0;
watch(() => localVideo.value?.mediaId || editingVideoMedia.value[0]?.mediaId, async id => {
 const revision = ++previewRevision;
 targetPreviewFailed.value = false;
 if (targetPreview.value) URL.revokeObjectURL(targetPreview.value);
 targetPreview.value = '';
 if (!id || !currentUser.value) return;
 try { const blob = await getMedia(currentUser.value.id, id); if (blob && revision === previewRevision) targetPreview.value = URL.createObjectURL(blob); } catch { /* Replace unavailable media through the source picker. */ }
});
onBeforeUnmount(() => { previewRevision++; if (targetPreview.value) URL.revokeObjectURL(targetPreview.value); });
const quickPrompts: Record<QuickAction, string> = {
  '拆解视频脚本': '',
  '修改视频': '',
  '爆款视频复刻': '参考该视频的 Hook、叙事结构与节奏，结合我的产品创作新视频。',
};
function selectQuickAction(action: QuickAction) {
  const previous = selectedQuickAction.value;
  if (previous && brief.value === quickPrompts[previous]) brief.value = quickPrompts[action];
  selectedQuickAction.value = action;
  mode.value = '视频';
  videoSourceError.value = '';
  videoSourceOpen.value = true;
}
function clearVideoReference() {
  clearReference();
  localVideo.value = null;
  editingVideoMedia.value = [];
}
function attachQuickVideo(reference: { id: string; title: string; author: string }) {
  referenceVideo.value = reference;
  if (!brief.value.trim() && selectedQuickAction.value) brief.value = quickPrompts[selectedQuickAction.value];
  videoSourceOpen.value = false;
  void nextTick(() => consoleRoot.value?.querySelector('textarea')?.focus());
}
function attachVideoLink() {
  if (isArchived.value) { videoSourceError.value = '归档项目仅可查看'; return; }
  try {
    const url = new URL(videoLink.value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
    const reference = { id: uid(), title: url.hostname + url.pathname, author: '视频链接', url: url.href, source: '粘贴链接', duration: '待分析' };
    studio.value.references.unshift(reference);
    localVideo.value = null;
    editingVideoMedia.value = [];
    attachQuickVideo(reference);
    videoLink.value = '';
  } catch { videoSourceError.value = '请输入有效的 http 或 https 视频链接'; }
}
async function uploadQuickVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || videoUploading.value) return;
  videoSourceError.value = '';
  try {
    if (isArchived.value) throw new Error('归档项目仅可查看');
    if (!file.type.startsWith('video/')) throw new Error('请选择视频文件');
    if (!currentUser.value) throw new Error('请先登录后上传');
    videoUploading.value = true;
    const mediaId = await saveMedia(currentUser.value.id, file);
    const reference = { id: uid(), title: file.name, author: '本地视频', url: '', source: '本地上传', duration: '待分析' };
    studio.value.references.unshift(reference);
    editingVideoMedia.value = [];
    localVideo.value = { id: reference.id, name: file.name, type: '视频', mediaId };
    attachQuickVideo(reference);
  } catch (error) { videoSourceError.value = (error as Error).message; }
  finally { videoUploading.value = false; input.value = ''; }
}
const MAX_ASSETS = 3;
const currentProject = computed(() => studio.value.projects.find((item) => item.id === projectId) ?? projects.find((item) => item.id === projectId));
const isArchived = computed(() => !!studio.value.projects.find(item => item.id === projectId)?.archived);
const projectLabel = computed(() => currentProject.value?.name ?? '新建项目');
const productOptions = computed<Product[]>(
  () => workspace?.projectProducts.value ?? products.filter((item) => !projectId || item.projectId === projectId),
);
const currentEngine = computed(() => engines[engine.value]!);
const hasAttachments = computed(
  () => selectedAssets.value.length > 0 || selectedLocalImageRefs.value.length > 0 || !!referenceVideo.value || selectedProducts.value.length > 0,
);
const assetChipLabel = computed(() =>
  selectedAssets.value.length > 0
    ? `参考图 ${selectedAssets.value.length}/${MAX_ASSETS}`
    : '素材库',
);

function applyRemakeDraft() {
  localVideo.value = null;
  if (remakeRef.value && quickActions) selectedQuickAction.value = '爆款视频复刻';
  if (!remakeRef.value && remakeBrief.value == null) return;
  const nextBrief = takeBrief();
  brief.value = nextBrief ?? (remakeRef.value ? REMAKE_PROMPT : brief.value);
  mode.value = '视频';
  engine.value = 0;
  quality.value = '1080P';
  ratio.value = '16:9';
  duration.value = '15';
  audio.value = true;
}

watch(remakeNonce, () => applyRemakeDraft());

function appendMention(label: string) {
  const token = `@${label}`;
  brief.value = brief.value.includes(token) ? brief.value : `${brief.value}${brief.value ? ' ' : ''}${token}`;
}

function stripMention(label: string) {
  const token = `@${label}`;
  brief.value = brief.value
    .replace(new RegExp(`\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateName(name: string, max = 18) {
  const base = name.replace(/\.[^.]+$/, '');
  return base.length > max ? `${base.slice(0, max)}…` : base;
}

function removeAsset(id: string) {
  selectedAssets.value = selectedAssets.value.filter((item) => item.id !== id);
}
async function uploadReferenceImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
  if (!files.length) return;
  if (selectedAssets.value.length + selectedLocalImageRefs.value.length + files.length > MAX_ASSETS) {
    toast.error(`参考素材最多选择 ${MAX_ASSETS} 个`); input.value = ''; return;
  }
  try {
    for (const file of files) selectedLocalImageRefs.value.push({ id: uid(), name: file.name, type: '图片', mediaId: await saveMedia(currentUser.value!.id, file) });
  } catch (error) { toast.error((error as Error).message); }
  finally { input.value = ''; }
}

function removeProduct(id: string) {
  const target = selectedProducts.value.find((item) => item.id === id);
  if (target) stripMention(target.name);
  selectedProducts.value = selectedProducts.value.filter((item) => item.id !== id);
}

function triggerEl(key: Exclude<MenuKey, null>) {
  if (key === 'asset') return assetBtn.value;
  if (key === 'product') return productBtn.value;
  if (key === 'engine') return engineBtn.value;
  if (key === 'quality') return qualityBtn.value;
  return ratioBtn.value;
}

function panelSize(key: Exclude<MenuKey, null>) {
  if (key === 'asset') return { w: 540, h: 420 };
  if (key === 'product') return { w: 380, h: 360 };
  if (key === 'engine') return { w: 320, h: 200 };
  return { w: 160, h: 180 };
}

function placeMenu(key: Exclude<MenuKey, null>) {
  const el = triggerEl(key);
  if (!el) {
    menuStyle.value = { left: '16px', top: '80px' };
    return;
  }
  const rect = el.getBoundingClientRect();
  const { w, h } = panelSize(key);
  const gap = 10;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  // 顶部触发的素材库/产品卡优先向下展开，避免被视口裁切
  const preferBelow = key === 'asset' || key === 'product' || spaceAbove < h + gap;
  const openBelow = preferBelow ? spaceBelow >= Math.min(h, 240) || spaceBelow >= spaceAbove : false;

  let left = Math.min(Math.max(16, rect.left), window.innerWidth - w - 16);
  const style: Record<string, string> = { left: `${left}px` };
  if (openBelow) {
    style.top = `${rect.bottom + gap}px`;
  } else {
    style.bottom = `${window.innerHeight - rect.top + gap}px`;
  }
  menuStyle.value = style;
}

async function toggleMenu(next: Exclude<MenuKey, null>) {
  if (menu.value === next) {
    menu.value = null;
    return;
  }
  menu.value = next;
  await nextTick();
  placeMenu(next);
}

function closeMenu() {
  menu.value = null;
}

function selectEngine(index: number) {
  engine.value = index;
  closeMenu();
}

function selectQuality(item: (typeof qualityOptions)[number]) {
  quality.value = item;
  closeMenu();
}

function selectRatio(item: (typeof ratioOptions)[number]) {
  ratio.value = item;
  closeMenu();
}

function onPickAsset(asset: Asset) {
  if (selectedAssets.value.some((item) => item.id === asset.id)) {
    closeMenu();
    toast.info('该素材已添加');
    return;
  }
  if (selectedAssets.value.length >= MAX_ASSETS) {
    toast.error(`最多添加 ${MAX_ASSETS} 个素材`);
    return;
  }
  selectedAssets.value = [...selectedAssets.value, asset];
  closeMenu();
  toast.success(`已添加素材「${asset.name}」`);
}

function onPickProduct(item: Product) {
  if (!selectedProducts.value.some((p) => p.id === item.id)) {
    selectedProducts.value = [...selectedProducts.value, item];
  }
  appendMention(item.name);
  closeMenu();
  toast.success(`已引用产品卡「${item.name}」`);
}

function onDurationInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '');
  duration.value = raw.slice(0, 3);
}

function onDocumentClick(event: MouseEvent) {
  if (!(event.target instanceof Node)) return;
  if (consoleRoot.value?.contains(event.target)) return;
  if (event.target instanceof Element && event.target.closest('[data-console-picker]')) return;
  menu.value = null;
}

function resizePrompt() {
  if (!spacious) return;
  const textarea = consoleRoot.value?.querySelector('textarea');
  if (!textarea) return;
  if (inputExpanded.value) {
    textarea.style.height = '';
    textarea.style.overflowY = 'auto';
    return;
  }
  textarea.style.height = '120px';
  const height = Math.max(120, Math.min(220, textarea.scrollHeight));
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > 220 ? 'auto' : 'hidden';
}
watch([brief, inputExpanded], () => { void nextTick(resizePrompt); }, { flush: 'post' });

function onResize() {
  resizePrompt();
  if (menu.value) placeMenu(menu.value);
}

onMounted(() => {
  void nextTick(resizePrompt);
  const reference = studio.value.references.find(r=>r.id===creationRoute.query.reference);
  if (reference) { referenceVideo.value = { id: reference.id, title: reference.title, author: reference.author }; brief.value = '参考该内容的 Hook、叙事结构与节奏，结合我的产品创作新的品牌视频。'; }
  const routeProduct = productOptions.value.find(p=>p.id===creationRoute.query.product);
  if (routeProduct) selectedProducts.value = [routeProduct];
  document.addEventListener('mousedown', onDocumentClick);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onResize, true);
  applyRemakeDraft();
  const scriptSource = studio.value.films.find(f => f.id === creationRoute.query.scriptSource && f.projectId === projectId && f.resultKind === 'script-breakdown');
  if (scriptSource) {
    selectedQuickAction.value = null;
    brief.value = breakdownText(scriptSource);
    referenceVideo.value = scriptSource.reference ?? null;
    editingVideoMedia.value = (scriptSource.referenceAssets ?? []).filter(a => a.mediaId).map(a => ({ ...a, mediaId: a.mediaId! }));
  }
  const editingFilm = studio.value.films.find(f => f.id === creationRoute.query.editFilm && f.projectId === projectId) ?? studio.value.jobs.find(j => j.id === creationRoute.query.editFilm && j.projectId === projectId)?.film;
  if (editingFilm) {
    brief.value = editingFilm.type === '视频' ? '' : editingFilm.brief;
    if (editingFilm.type === '视频') selectedQuickAction.value = '修改视频';
    mode.value = editingFilm.type;
    duration.value = editingFilm.duration;
    if (ratioOptions.includes(editingFilm.ratio as typeof ratioOptions[number])) ratio.value = editingFilm.ratio as typeof ratioOptions[number];
    if (qualityOptions.includes(editingFilm.quality as typeof qualityOptions[number])) quality.value = editingFilm.quality as typeof qualityOptions[number];
    selectedProducts.value = productOptions.value.filter(p => editingFilm.productIds.includes(p.id));
    if (editingFilm.type === '视频') {
      const sourceId = `film-reference-${creationRoute.query.editFilm}`;
      const sourceReference = { id: sourceId, title: editingFilm.title, author: '我的作品', url: '', source: '当前视频', duration: editingFilm.duration };
      if (!studio.value.references.some(reference => reference.id === sourceId)) studio.value.references.unshift(sourceReference);
      referenceVideo.value = { id: sourceId, title: editingFilm.title, author: '我的作品' };
      editingVideoMedia.value = editingFilm.mediaIds.map(mediaId => ({ id: mediaId, name: editingFilm.title, type: '视频', mediaId }));
    } else {
      referenceVideo.value = editingFilm.reference ? { id: editingFilm.reference.id, title: editingFilm.reference.title, author: editingFilm.reference.author } : null;
    }
    void nextTick(() => consoleRoot.value?.querySelector('textarea')?.focus());
  }
  if (reference) void nextTick(() => consoleRoot.value?.querySelector('textarea')?.focus());
});
onBeforeUnmount(() => {
  stopTaskTransfer?.();
  document.removeEventListener('mousedown', onDocumentClick);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('scroll', onResize, true);
});

function generate() {
  if (generating.value) return;
  if (selectedQuickAction.value && !referenceVideo.value) { videoSourceOpen.value = true; videoSourceError.value = '请先上传视频或添加视频链接'; return; }
  if (selectedQuickAction.value === '拆解视频脚本' && projectId) {
    try {
      generating.value = true;
      const script = mockBreakdown();
      startBreakdown({ projectId, title: '脚本拆解 · ' + referenceVideo.value!.title, type: '视频', source: '普通创作', duration: '', ratio: '', quality: '', brief: breakdownText({ breakdownScript: script }), resultKind: 'script-breakdown', breakdownScript: script, productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: blankAttributes(), reference: studio.value.references.find(r => r.id === referenceVideo.value?.id), referenceAssets: [...(localVideo.value ? [localVideo.value] : []), ...editingVideoMedia.value] });
      toast.success('拆解任务已提交');
      delay(() => { generating.value = false; }, 5000);
    } catch (error) { generating.value = false; toast.error((error as Error).message); }
    return;
  }
  if (!brief.value.trim()) { toast.error('请描述你的创作需求'); return; }
  if (projectId && studio.value.projects.find(p=>p.id===projectId)?.archived) { toast.error('归档项目无法生成'); return; }
  if (projectId) {
    for (let i = 0; i < batch.value; i++) startGeneration({ projectId, title: `${brief.value}${batch.value > 1 ? ` #${i+1}` : ''}`, type: mode.value, source: '普通创作', duration: duration.value || '15', ratio: ratio.value, quality: quality.value, brief: selectedQuickAction.value ? `【${selectedQuickAction.value}】${brief.value}` : brief.value, productIds: selectedProducts.value.map(p=>p.id), referenceAssets: [...selectedAssets.value.map(({id,name,type}) => ({id,name,type})), ...selectedLocalImageRefs.value.map(({id,name,type,mediaId}) => ({id,name,type,mediaId})), ...(localVideo.value ? [localVideo.value] : []), ...editingVideoMedia.value], reference: studio.value.references.find(r=>r.id===referenceVideo.value?.id), version: 1, mediaIds: [], inPublishing: false, attributes: { ...blankAttributes(), product: selectedProducts.value[0]?.name ?? '未分类', format: mode.value === '图文' ? '图文轮播' : '产品展示' } });
    const target = document.querySelector<HTMLElement>('[data-video-management]');
    if (generateButton.value && target) {
      stopTaskTransfer?.();
      stopTaskTransfer = animateTaskTransfer(generateButton.value, target);
    }
    toast.success('生成视频任务提交成功', {
      action: {
        label: '查看',
        onClick: () => { void router.push({ path: `/projects/${projectId}`, query: { section: 'publish', tab: 'creations' } }); },
      },
    });
    return;
  }
  const count = batch.value;
  const firstDraft = draftIdx.value;
  generating.value = true;
  emit('start');
  toast.info('AI 开始生成，预计 30 秒（演示）');
  delay(() => {
    const items = Array.from(
      { length: count },
      (_, i) => consoleDraftPool[(firstDraft + i) % consoleDraftPool.length]!,
    );
    draftIdx.value = (firstDraft + count) % consoleDraftPool.length;
    generating.value = false;
    emit('done', items);
    toast.success(`已生成 ${count} 条内容`);
  }, 1800);
}

const chipClass =
  'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-600 transition hover:border-sky-300 hover:text-sky-600';
</script>

<template>
  <div class="w-full">
  <div
    ref="consoleRoot"
    :class="cn('w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm', spacious && 'p-4 xl:p-5', className)"
  >
    <div class="flex gap-3">
      <div v-if="!selectedQuickAction" class="flex flex-col gap-1">
        <button
          v-for="[m, Icon] in [
            ['视频', Clapperboard],
            ['图文', ImageIcon],
          ] as const"
          :key="m"
          type="button"
          :class="
            cn(
              'flex w-12 flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-[11px] transition-colors',
              mode === m
                ? 'bg-sky-50 font-medium text-sky-600'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600',
            )
          "
          @click="mode = m"
        >
          <component :is="Icon" class="h-5 w-5" />
          {{ m }}
        </button>
      </div>

      <div class="min-w-0 flex-1">
        <div v-if="selectedQuickAction !== '拆解视频脚本'" class="mb-3 flex flex-wrap items-center gap-2">
          <button
            ref="assetBtn"
            type="button"
            title="从素材库选择"
            :class="
              cn(
                chipClass,
                (menu === 'asset' || selectedAssets.length > 0) && 'border-sky-300 bg-sky-50 text-sky-600',
              )
            "
            @click.stop="toggleMenu('asset')"
          >
            <Plus v-if="selectedAssets.length > 0" class="h-3.5 w-3.5" />
            <FolderOpen v-else class="h-3.5 w-3.5" />
            {{ assetChipLabel }}
          </button>
          <label :class="cn(chipClass, 'cursor-pointer')" title="上传图片作为 AI 参考素材"><ImageIcon class="h-3.5 w-3.5" />上传参考图<input class="hidden" type="file" accept="image/*" multiple @change="uploadReferenceImages"></label>
          <template v-if="selectedProducts.length > 0">
            <span
              v-for="item in selectedProducts"
              :key="item.id"
              class="inline-flex max-w-[200px] items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-600"
            >
              <AtSign class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate">{{ item.name }}</span>
              <button
                type="button"
                title="移除产品卡"
                class="rounded p-0.5 text-sky-400 transition hover:bg-sky-100 hover:text-sky-700"
                @click.stop="removeProduct(item.id)"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
            <button
              ref="productBtn"
              type="button"
              title="继续引用产品卡"
              :class="cn(chipClass, menu === 'product' && 'border-sky-300 bg-sky-50 text-sky-600')"
              @click.stop="toggleMenu('product')"
            >
              <AtSign class="h-3.5 w-3.5" />
              +
            </button>
          </template>
          <button
            v-else
            ref="productBtn"
            type="button"
            title="引用产品卡"
            :class="cn(chipClass, menu === 'product' && 'border-sky-300 bg-sky-50 text-sky-600')"
            @click.stop="toggleMenu('product')"
          >
            <AtSign class="h-3.5 w-3.5" />
            产品卡
          </button>
          <DropdownMenu v-if="!projectId">
            <DropdownMenuTrigger as-child>
              <button type="button" aria-label="选择项目" :class="chipClass">
                <FolderPlus class="h-3.5 w-3.5" />
                <span class="max-w-28 truncate">{{ projectLabel }}</span>
                <ChevronDown class="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-52 border-slate-200 bg-white p-1 text-slate-800 shadow-lg">
              <DropdownMenuItem
                v-for="item in projects"
                :key="item.id"
                class="cursor-pointer gap-2 focus:bg-sky-50"
                @click="router.push(`/projects/${item.id}`)"
              >
                <span class="h-2.5 w-2.5 shrink-0 rounded-[4px]" :style="{ backgroundColor: item.color }" />
                <span class="truncate">{{ item.name }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="bg-slate-100" />
              <DropdownMenuItem class="cursor-pointer gap-2 focus:bg-sky-50" @click="router.push('/projects/new')">
                <FolderPlus class="h-3.5 w-3.5 text-slate-400" />
                新建项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        <div
          class="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          :class="hasAttachments && 'border-sky-200 bg-slate-50/40'"
        >
          <div :class="selectedQuickAction ? 'flex flex-col gap-3 p-3 sm:flex-row sm:items-start' : ''">
            <aside v-if="selectedQuickAction" aria-label="目标视频" class="relative w-full shrink-0 rounded-xl border border-sky-100 bg-sky-50/60 p-3 sm:w-44 xl:w-48">
              <button v-if="referenceVideo" type="button" aria-label="移除目标视频" class="absolute right-2 top-2 rounded-md bg-white p-1 text-slate-400 hover:text-rose-500" @click="clearVideoReference"><X class="h-3.5 w-3.5" /></button>
              <video v-if="targetPreview && !targetPreviewFailed" :src="targetPreview" @error="targetPreviewFailed = true" controls preload="metadata" class="mb-2 aspect-video w-full rounded-lg bg-slate-900" />
              <button type="button" aria-label="选择或替换目标视频" :class="targetPreview && !targetPreviewFailed ? 'min-h-16' : 'min-h-36'" class="flex w-full flex-col items-center justify-center gap-3 rounded-lg px-2 py-4 text-center text-sky-600 transition hover:bg-sky-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500" @click="videoSourceOpen = true">
                <span v-if="!targetPreview || targetPreviewFailed" class="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm"><Clapperboard v-if="!targetPreview || targetPreviewFailed" class="h-6 w-6" /><Plus v-else class="h-6 w-6" /></span>
                <span class="text-xs font-medium">{{ selectedQuickAction === '爆款视频复刻' ? '要复刻的视频' : selectedQuickAction === '修改视频' ? '要修改的视频' : '要拆解的视频' }}</span>
                <span v-if="referenceVideo" class="w-full truncate text-xs text-slate-600" :title="referenceVideo.title">{{ referenceVideo.title }}</span>
                <span v-else class="text-xs text-slate-400">上传视频或粘贴链接</span>
                <span v-if="referenceVideo" class="text-[11px] text-slate-400">替换视频 · {{ studio.references.find(r => r.id === referenceVideo?.id)?.source || '爆款视频' }}</span>
              </button>
            </aside>
            <div class="relative min-w-0 flex-1">
          <button
            v-if="spacious && selectedQuickAction !== '拆解视频脚本'"
            type="button"
            :aria-label="inputExpanded ? '收起输入框' : '放大输入框'"
            :title="inputExpanded ? '收起输入框（Esc）' : '放大输入框'"
            :aria-expanded="inputExpanded"
            class="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
            @click="toggleInputSize"
          >
            <component :is="inputExpanded ? Minimize2 : Maximize2" class="h-4 w-4" />
          </button>
          <div
            v-if="(!selectedQuickAction && referenceVideo) || selectedAssets.length > 0 || selectedLocalImageRefs.length > 0"
            class="flex flex-wrap gap-2 px-3 pt-3"
            :class="spacious && 'pr-12'"
          >
            <div
              v-if="referenceVideo && !selectedQuickAction"
              class="inline-flex w-full max-w-[380px] items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2"
            >
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                <Play class="h-3.5 w-3.5 translate-x-px" fill="currentColor" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-semibold text-sky-600">{{ selectedQuickAction || '爆款复刻' }}参考 · {{ studio.references.find(r => r.id === referenceVideo?.id)?.source || '爆款视频' }}</p>
                <p class="mt-0.5 truncate text-[12px] font-medium text-slate-700" :title="referenceVideo.title || referenceVideo.author">{{ referenceVideo.title || referenceVideo.author }}</p>
                <p v-if="studio.references.find(r => r.id === referenceVideo?.id)?.url" class="mt-0.5 truncate text-[11px] text-slate-400" :title="studio.references.find(r => r.id === referenceVideo?.id)?.url">{{ studio.references.find(r => r.id === referenceVideo?.id)?.url }}</p>
                <p class="mt-0.5 text-[11px] leading-5 text-slate-500">{{ selectedQuickAction === '修改视频' ? '已引用当前视频，请描述需要修改的内容。' : '参考脚本与节奏，创作品牌新视频。' }}</p>
              </div>
              <button
                type="button"
                title="移除参考视频"
                class="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-sky-100 hover:text-sky-600"
                @click="clearVideoReference"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              v-for="asset in selectedAssets"
              :key="asset.id"
              class="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
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
              <span class="min-w-0 truncate text-[12px] font-medium text-slate-700">
                {{ truncateName(asset.name) }}
              </span>
              <button
                type="button"
                title="移除素材"
                class="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                @click="removeAsset(asset.id)"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
            <div v-for="asset in selectedLocalImageRefs" :key="asset.id" class="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600"><ImageIcon class="h-3.5 w-3.5" /></span>
              <span class="max-w-48 truncate text-[12px] font-medium text-slate-700">{{ asset.name }}</span>
              <button type="button" title="移除参考图片" class="rounded p-0.5 text-slate-400 hover:text-slate-700" @click="selectedLocalImageRefs = selectedLocalImageRefs.filter(item => item.id !== asset.id)"><X class="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div v-if="selectedQuickAction" class="flex items-center gap-2 px-4 pt-3">
            <span class="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-600">
              <Clapperboard class="h-3.5 w-3.5" />{{ selectedQuickAction }}
              <button type="button" aria-label="移除快捷入口标签" class="rounded hover:bg-sky-100" @click="selectedQuickAction = null"><X class="h-3 w-3" /></button>
            </span>
          </div>
          <Textarea
            v-if="selectedQuickAction !== '拆解视频脚本'"
            v-model="brief"
            aria-label="创作提示词"
            @keydown.esc="inputExpanded = false"
            :placeholder="selectedQuickAction === '修改视频' ? '告诉我你要修改的内容，如：修改第5-6秒人物表情......' : placeholder ?? '描述你的场景，使用 @ 添加产品卡信息'"
            :class="
              cn(
                'resize-none border-0 bg-transparent text-[13.5px] leading-relaxed placeholder:text-slate-400 focus-visible:ring-0',
                spacious ? (inputExpanded ? 'h-[min(52vh,480px)] min-h-[260px] p-4 text-sm' : 'h-[120px] min-h-[120px] max-h-[220px] p-4 text-sm') : 'min-h-[88px]',
                spacious && 'pr-12',
                (referenceVideo || selectedAssets.length > 0) && 'pt-2',
              )
            "
          />
            </div>
          </div>
        </div>

        <div class="relative mt-2 flex items-center justify-end gap-2">
          <div v-if="selectedQuickAction !== '拆解视频脚本'" class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <button
              ref="engineBtn"
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-600 transition hover:bg-sky-100"
              @click.stop="toggleMenu('engine')"
            >
              <Sparkles class="h-3.5 w-3.5" />
              {{ currentEngine.name }}
              <ChevronRight class="h-3 w-3" />
            </button>
            <button
              ref="qualityBtn"
              type="button"
              title="分辨率"
              :class="cn(chipClass, menu === 'quality' && 'border-sky-300 bg-sky-50 text-sky-600')"
              @click.stop="toggleMenu('quality')"
            >
              <Monitor class="h-3.5 w-3.5 text-slate-400" />
              {{ quality }}
            </button>
            <button
              ref="ratioBtn"
              type="button"
              title="画幅比例"
              :class="cn(chipClass, menu === 'ratio' && 'border-sky-300 bg-sky-50 text-sky-600')"
              @click.stop="toggleMenu('ratio')"
            >
              <RectangleHorizontal class="h-3.5 w-3.5 text-slate-400" />
              {{ ratio }}
            </button>
            <label
              v-if="mode === '视频'"
              title="时长"
              class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-600 focus-within:border-sky-300"
            >
              <Clock class="h-3.5 w-3.5 text-slate-400" />
              <input
                :value="duration"
                inputmode="numeric"
                class="w-8 bg-transparent text-center outline-none"
                aria-label="时长秒数"
                @input="onDurationInput"
              />
              <span class="text-slate-400">s</span>
            </label>
            <button
              type="button"
              title="生成音频"
              :class="
                cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] transition',
                  audio
                    ? 'border-sky-200 bg-sky-50 font-medium text-sky-600'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600',
                )
              "
              @click="
                audio = !audio;
                toast.success(audio ? '已开启生成音频' : '已关闭生成音频');
              "
            >
              <Volume2 class="h-3.5 w-3.5" :class="audio ? 'text-sky-600' : 'text-slate-400'" />
              {{ audio ? '开' : '关' }}
            </button>
            <div
              class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[12px]"
              title="批量生成"
            >
              <button
                type="button"
                class="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                @click="batch = Math.max(1, batch - 1)"
              >
                <Minus class="h-3 w-3" />
              </button>
              <span class="min-w-7 text-center tabular-nums">
                <span class="font-semibold text-slate-800">{{ batch }}</span>
                <span class="text-slate-400">/4</span>
              </span>
              <button
                type="button"
                title="批量生成"
                class="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                @click="batch = Math.min(4, batch + 1)"
              >
                <Plus class="h-3 w-3" />
              </button>
            </div>
          </div>

          <button
            type="button"
            ref="generateButton"
            :disabled="generating"
            class="flex h-12 shrink-0 flex-col items-center justify-center rounded-xl brand-gradient px-5 text-white shadow-md shadow-sky-300/40 transition-all hover:opacity-90 disabled:opacity-60"
            @click="generate"
          >
            <span class="flex items-center gap-1 text-[14px] font-semibold">
              <Wand2 v-if="generating" class="h-4 w-4 animate-spin" />
              <Sparkles v-else class="h-4 w-4" />
              {{ selectedQuickAction === '拆解视频脚本' ? '拆解视频' : '生成' }}
            </span>
            <span v-if="selectedQuickAction !== '拆解视频脚本'" class="text-[10px] text-white/80">消耗 20 积分</span>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="menu === 'engine'"
        data-console-picker
        class="fixed z-[80] w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        :style="menuStyle"
        @click.stop
      >
        <button
          v-for="(item, index) in engines"
          :key="item.name"
          type="button"
          :class="
            cn(
              'flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition',
              engine === index
                ? 'border border-sky-300 bg-sky-50'
                : 'border border-transparent hover:bg-slate-50',
            )
          "
          @click="selectEngine(index)"
        >
          <AudioWaveform class="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <span class="min-w-0 flex-1">
            <span class="block text-[13px] font-medium text-slate-800">{{ item.name }}</span>
            <span class="mt-0.5 block text-[11px] leading-4 text-slate-400">{{ item.desc }}</span>
          </span>
          <Check v-if="engine === index" class="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        </button>
      </div>

      <div
        v-if="menu === 'quality'"
        data-console-picker
        class="fixed z-[80] w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        :style="menuStyle"
        @click.stop
      >
        <button
          v-for="item in qualityOptions"
          :key="item"
          type="button"
          :class="
            cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition',
              quality === item ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-600 hover:bg-slate-50',
            )
          "
          @click="selectQuality(item)"
        >
          {{ item }}
          <Check v-if="quality === item" class="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        v-if="menu === 'ratio'"
        data-console-picker
        class="fixed z-[80] w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        :style="menuStyle"
        @click.stop
      >
        <button
          v-for="item in ratioOptions"
          :key="item"
          type="button"
          :class="
            cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition',
              ratio === item ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-600 hover:bg-slate-50',
            )
          "
          @click="selectRatio(item)"
        >
          {{ item }}
          <Check v-if="ratio === item" class="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        v-if="menu === 'asset'"
        data-console-picker
        class="fixed z-[80] w-[540px]"
        :style="menuStyle"
        @click.stop
      >
        <ConsoleAssetPicker :project-name="currentProject?.name" @pick="onPickAsset" />
      </div>
      <div
        v-if="menu === 'product'"
        data-console-picker
        class="fixed z-[80] w-[380px]"
        :style="menuStyle"
        @click.stop
      >
        <ConsoleProductPicker :products="productOptions" @pick="onPickProduct" />
      </div>
    </Teleport>
  </div>
  <div v-if="quickActions" :class="cn('mx-auto mt-5 flex flex-wrap justify-center gap-3', className)" aria-label="视频快捷入口">
    <button v-for="action in (['拆解视频脚本', '爆款视频复刻'] as const)" :key="action" type="button" :aria-pressed="selectedQuickAction === action" :disabled="isArchived" class="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50" :class="selectedQuickAction === action ? 'border-sky-200 bg-sky-50 text-sky-600' : 'border-slate-200 bg-white text-slate-600'" @click="selectQuickAction(action)">
      <component :is="action === '拆解视频脚本' ? Clapperboard : Sparkles" class="h-4 w-4" />{{ action }}
    </button>
  </div>
  <Dialog :open="videoSourceOpen" @update:open="!videoUploading && (videoSourceOpen = $event)">
    <DialogContent class="max-w-lg bg-white">
      <DialogTitle>{{ selectedQuickAction || '添加参考视频' }}</DialogTitle>
      <p class="text-sm text-slate-500">上传本地视频，或粘贴视频链接作为参考素材。</p>
      <label class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 px-5 py-7 text-sm text-sky-600" :class="videoUploading && 'pointer-events-none opacity-50'">
        <Clapperboard class="h-7 w-7" />{{ videoUploading ? '正在上传…' : '上传本地视频' }}
        <input type="file" accept="video/*" aria-label="上传快捷入口视频" class="sr-only" :disabled="videoUploading" @change="uploadQuickVideo" />
      </label>
      <div class="flex gap-2">
        <input v-model="videoLink" aria-label="视频链接" class="studio-field min-w-0 flex-1" placeholder="粘贴视频链接（https://…）" :disabled="videoUploading" @keydown.enter.prevent="attachVideoLink" />
        <button class="studio-primary shrink-0" :disabled="videoUploading || !videoLink.trim()" @click="attachVideoLink">使用链接</button>
      </div>
      <p class="text-xs text-slate-400">本地演示仅保存参考素材，不会真实解析远程视频。</p>
      <p v-if="videoSourceError" role="alert" class="text-xs text-rose-600">{{ videoSourceError }}</p>
      <RouterLink v-if="selectedQuickAction === '爆款视频复刻'" to="/inspiration" class="inline-flex items-center gap-1 text-sm text-sky-600" @click="videoSourceOpen = false">查看更多爆款视频 <ChevronRight class="h-4 w-4" /></RouterLink>
    </DialogContent>
  </Dialog>
  </div>
</template>
