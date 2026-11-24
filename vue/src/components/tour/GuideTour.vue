<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { ArrowRight, MousePointer2, Sparkles, X } from 'lucide-vue-next';
import { currentUser } from '@/services/identity';
import { guideTour } from '@/services/guideTour';
import { createProject, ensurePublishTask, studio } from '@/services/studio';

const router = useRouter();
const route = useRoute();
const { progress } = guideTour;
const steps = [
  {
    title: '项目',
    body: '在这里查看和管理项目。每个项目都有独立的创作空间、作品列表和发布记录。',
    targets: ['projects', 'project-list'],
  },
  {
    title: '创作视频',
    body: '这里是自由创作页面。输入视频想法、添加参考素材并选择模型，即可开始创作；也可以切换到专家模式。',
    targets: ['create-nav', 'create-console'],
  },
  {
    title: '我的作品',
    body: '这里保存已创作的视频和图文，也可以通过“上传本地作品”添加自己的视频。准备好后，点击作品旁的“去发布”。',
    targets: ['works-nav', 'works-upload'],
  },
  {
    title: '去发布',
    body: '这里是发布配置页面。先绑定 TikTok 账号并关联到项目，或选择已关联的账号，再确认文案、可见范围和发布时间。',
    targets: ['publish-accounts', 'bind-account'],
  },
  {
    title: '发布成功',
    body: '发布成功后，在这里查看视频播放、点赞、评论和分享数据；切换到账号数据，可查看账号的粉丝与内容表现。',
    targets: ['video-data', 'account-data', 'account-data-link'],
  },
];
const step = computed(() => progress.value?.step ?? 0);
const current = computed(() => steps[step.value]!);
const visible = computed(
  () =>
    !!currentUser.value &&
    route.matched.length > 0 &&
    !['auth', 'unlock'].includes(String(route.name)) &&
    progress.value?.status === 'in-progress',
);
const activeProjects = computed(() => studio.value.projects.filter((p) => !p.archived));
const project = computed(
  () =>
    activeProjects.value.find((p) => p.id === progress.value?.projectId) ??
    activeProjects.value.find((p) => p.id === route.params.id) ??
    activeProjects.value[0],
);
const hasWorks = computed(() =>
  studio.value.films.some((f) => f.projectId === project.value?.id && f.resultKind !== 'script-breakdown'),
);
const projectName = ref('我的第一个项目');
const busy = ref(false);
const error = ref('');
const retry = ref(0);
const bubble = ref<HTMLElement>();
const closeButton = ref<HTMLButtonElement>();
type Rectangle = { x: number; y: number; width: number; height: number };
const rectangles = ref<Rectangle[]>([]);
const position = ref({ left: 'auto', right: '24px', top: 'auto', bottom: '24px' });
let frame = 0;
let sequence = 0;
let previousFocus: HTMLElement | null = null;
let resizeObserver: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;

watch(
  () => currentUser.value?.id,
  (id) => guideTour.activate(id ?? null),
  { immediate: true },
);
watch(
  () => [route.fullPath, progress.value?.status, currentUser.value?.id],
  () => {
    if (
      currentUser.value &&
      route.matched.length &&
      !['auth', 'unlock'].includes(String(route.name)) &&
      progress.value?.status === 'pending'
    )
      guideTour.move(0);
  },
  { immediate: true, flush: 'post' },
);

function destination(index: number): RouteLocationRaw {
  if (index === 0) return '/';
  const selected = project.value!;
  guideTour.selectProject(selected.id);
  const path = `/projects/${selected.id}`;
  if (index === 1) return { path, query: { section: 'gen', mode: 'normal' } };
  if (index === 2) return { path, query: { section: 'publish', tab: 'creations' } };
  if (index === 3) {
    // Reuse an editable draft, or prepare the actual work's draft just as “去发布” does.
    const draft = studio.value.tasks.find(
      (t) =>
        t.projectId === selected.id &&
        ['待配置', '发布失败', '已取消'].includes(t.status) &&
        studio.value.films.some((f) => f.id === t.filmId && f.resultKind !== 'script-breakdown'),
    );
    const film = studio.value.films.find(
      (f) => f.projectId === selected.id && f.resultKind !== 'script-breakdown',
    );
    const task = draft ?? (film ? ensurePublishTask(film, undefined, true) : undefined);
    return { path, query: { section: 'publish', tab: 'configure', ...(task ? { task: task.id } : {}) } };
  }
  return { path, query: { section: 'analytics', report: 'content' } };
}

watch(
  [visible, step, () => currentUser.value?.id, retry],
  async ([show, index], _, onCleanup) => {
    const token = ++sequence;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    rectangles.value = [];
    if (!show) {
      busy.value = false;
      return;
    }
    busy.value = true;
    error.value = '';
    try {
      if (index > 0 && !project.value) {
        guideTour.move(0);
        return;
      }
      // Remember the current real project before step 1 returns to the project list.
      if (project.value) guideTour.selectProject(project.value.id);
      const target = destination(index);
      const result =
        router.resolve(target).fullPath === route.fullPath ? undefined : await router.push(target);
      if (cancelled) return;
      if (result) throw new Error('页面跳转未完成，请重试。');
      await nextTick();
      refreshTargets(true);
      closeButton.value?.focus({ preventScroll: true });
    } catch (cause) {
      if (!cancelled) error.value = cause instanceof Error ? cause.message : '页面暂时无法打开，请稍后重试。';
    } finally {
      if (token === sequence) busy.value = false;
    }
  },
  { immediate: true, flush: 'post' },
);

function refreshTargets(scroll = false) {
  if (!visible.value) return;
  const targets = current.value.targets.flatMap((target) =>
    Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)).slice(0, 1),
  );
  if (scroll) targets.at(-1)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  rectangles.value = targets.flatMap((element) => {
    const box = element.getBoundingClientRect();
    const x = Math.max(6, box.left - 5),
      y = Math.max(6, box.top - 5);
    const width = Math.min(innerWidth - 6, box.right + 5) - x;
    const height = Math.min(innerHeight - 6, box.bottom + 5) - y;
    return width > 0 && height > 0 ? [{ x, y, width, height }] : [];
  });
  const width = bubble.value?.offsetWidth ?? 340;
  const height = bubble.value?.offsetHeight ?? 400;
  const maxX = Math.max(12, innerWidth - width - 16),
    maxY = Math.max(12, innerHeight - height - 16);
  const last = rectangles.value.at(-1);
  const candidates = last
    ? [
        { x: last.x + last.width + 18, y: last.y },
        { x: last.x - width - 18, y: last.y },
        { x: last.x, y: last.y + last.height + 18 },
        { x: last.x, y: last.y - height - 18 },
        { x: maxX, y: maxY },
        { x: maxX, y: 16 },
        { x: 110, y: maxY },
      ]
    : [{ x: maxX, y: maxY }];
  const options = candidates.map((point) => ({
    x: Math.min(maxX, Math.max(12, point.x)),
    y: Math.min(maxY, Math.max(12, point.y)),
  }));
  const overlap = (point: { x: number; y: number }) =>
    rectangles.value.reduce(
      (sum, box) =>
        sum +
        Math.max(0, Math.min(point.x + width, box.x + box.width) - Math.max(point.x, box.x)) *
          Math.max(0, Math.min(point.y + height, box.y + box.height) - Math.max(point.y, box.y)),
      0,
    );
  const chosen = options.reduce(
    (best, point) => (overlap(point) < overlap(best) ? point : best),
    options[0]!,
  );
  position.value = { left: `${chosen.x}px`, top: `${chosen.y}px`, right: 'auto', bottom: 'auto' };
}
function requestMeasure() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => refreshTargets());
}
function keyboard(event: KeyboardEvent) {
  // Do not steal Escape from an actual account picker or authorization dialog.
  if (event.key === 'Escape' && bubble.value?.contains(event.target as Node)) {
    event.preventDefault();
    guideTour.end('skipped');
  }
}
function release() {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  window.removeEventListener('resize', requestMeasure);
  document.removeEventListener('scroll', requestMeasure, true);
  document.removeEventListener('keydown', keyboard);
  cancelAnimationFrame(frame);
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  previousFocus = null;
}
watch(
  visible,
  async (show) => {
    if (!show) {
      release();
      return;
    }
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    if (!visible.value) return;
    resizeObserver = new ResizeObserver(requestMeasure);
    if (bubble.value) resizeObserver.observe(bubble.value);
    const background = document.querySelector('[data-tour-background]');
    mutationObserver = new MutationObserver(requestMeasure);
    if (background) mutationObserver.observe(background, { childList: true, subtree: true });
    window.addEventListener('resize', requestMeasure);
    document.addEventListener('scroll', requestMeasure, true);
    document.addEventListener('keydown', keyboard);
    requestMeasure();
  },
  { immediate: true, flush: 'post' },
);
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    requestMeasure();
  },
);

function move(index: number) {
  if (busy.value) return;
  if (step.value === 0 && index === 1 && !project.value) {
    if (!projectName.value.trim()) {
      error.value = '请填写项目名称';
      return;
    }
    guideTour.selectProject(createProject(projectName.value).id);
  }
  busy.value = true;
  guideTour.move(index);
}
async function showData(kind: 'video' | 'account') {
  if (busy.value) return;
  busy.value = true;
  try {
    if (kind === 'video') await router.push(destination(4));
    else {
      const account =
        studio.value.accounts.find(
          (a) =>
            !a.deleted &&
            a.status !== '已解绑' &&
            (a.source === 'recharge' || project.value?.accountIds.includes(a.id)),
        ) ?? studio.value.accounts.find((a) => !a.deleted && a.status !== '已解绑');
      await router.push(account ? `/accounts/${account.id}` : '/accounts');
    }
    await nextTick();
    refreshTargets(true);
  } catch {
    error.value = '数据页面暂时无法打开，请稍后重试。';
  } finally {
    busy.value = false;
  }
}
onBeforeUnmount(() => {
  sequence++;
  release();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="guide-tour">
      <svg class="spotlight" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="guide-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect v-for="(box, index) in rectangles" :key="index" v-bind="box" rx="10" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,23,42,.24)" mask="url(#guide-tour-mask)" />
        <rect
          v-for="(box, index) in rectangles"
          :key="`border-${index}`"
          v-bind="box"
          rx="10"
          fill="none"
          stroke="#38bdf8"
          stroke-width="2"
        />
      </svg>
      <section
        ref="bubble"
        role="dialog"
        aria-modal="false"
        aria-labelledby="guide-tour-title"
        aria-describedby="guide-tour-description"
        :aria-busy="busy"
        class="tour-bubble"
        :style="position"
      >
        <div class="bubble-top">
          <span>
            <Sparkles :size="14" />
            新手引导
          </span>
          <button
            ref="closeButton"
            class="close-tour"
            aria-label="关闭新手引导"
            @click="guideTour.end('skipped')"
          >
            <X :size="18" />
          </button>
        </div>
        <p class="step-number" aria-live="polite">
          {{ String(step + 1).padStart(2, '0') }}
          <span>/ 05</span>
        </p>
        <h2 id="guide-tour-title">{{ current.title }}</h2>
        <p id="guide-tour-description" class="bubble-body">{{ current.body }}</p>
        <label v-if="step === 0 && !project" class="project-name">
          项目名称
          <input v-model="projectName" maxlength="60" aria-label="引导项目名称" @keydown.enter="move(1)" />
          <small>点击下一步将创建此项目，并打开自由创作页面。</small>
        </label>
        <div v-if="step === 2 && !hasWorks" class="publish-animation" aria-label="作品进入发布配置的流程动画">
          <span>我的作品</span>
          <ArrowRight :size="14" />
          <span class="animated-publish">
            去发布
            <MousePointer2 :size="16" />
          </span>
          <ArrowRight :size="14" />
          <span>发布配置</span>
        </div>
        <p v-if="step === 3 && !hasWorks" class="bubble-hint">
          当前项目还没有作品。可先绑定、关联账号；上传或创作作品后，即可配置并发布。
        </p>
        <template v-if="step === 4">
          <p class="bubble-hint">这里介绍发布后的数据入口。尚未发布或采集时，页面会显示实际空状态。</p>
          <div class="data-links">
            <button :disabled="busy" @click="showData('video')">视频数据 ↗</button>
            <button :disabled="busy" @click="showData('account')">账号数据 ↗</button>
          </div>
        </template>
        <p v-if="error" role="alert" class="tour-error">
          {{ error }}
          <button @click="retry++">重试</button>
        </p>
        <div class="step-dots" aria-label="引导进度">
          <span v-for="(_, index) in steps" :key="index" :class="{ done: index <= step }" />
        </div>
        <div class="bubble-actions">
          <button
            class="tour-back"
            :disabled="busy"
            @click="step > 0 ? move(step - 1) : guideTour.end('skipped')"
          >
            {{ step > 0 ? '上一步' : '跳过' }}
          </button>
          <button
            class="tour-next"
            :disabled="busy"
            @click="step === 4 ? guideTour.end('completed') : move(step + 1)"
          >
            {{ busy ? '正在打开…' : step === 4 ? '开始使用' : '下一步' }}
            <ArrowRight :size="16" />
          </button>
        </div>
        <button v-if="step > 0" class="skip-tour" @click="guideTour.end('skipped')">跳过引导</button>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.guide-tour {
  position: fixed;
  inset: 0;
  z-index: 45;
  pointer-events: none;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
}
.spotlight {
  position: absolute;
  inset: 0;
}
.tour-bubble {
  position: absolute;
  width: 340px;
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  overflow-y: auto;
  box-sizing: border-box;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  box-shadow: 0 20px 70px #0f172a29;
  pointer-events: auto;
}
.bubble-top,
.bubble-top > span,
.bubble-actions,
.tour-next,
.publish-animation {
  display: flex;
  align-items: center;
}
.bubble-top,
.bubble-actions {
  justify-content: space-between;
}
.bubble-top > span {
  gap: 7px;
  color: #0284c7;
  font-size: 12px;
  font-weight: 600;
}
.close-tour {
  display: grid;
  place-items: center;
  padding: 5px;
  border-radius: 8px;
  color: #94a3b8;
}
.close-tour:hover {
  background: #f1f5f9;
  color: #334155;
}
.step-number {
  margin: 16px 0 8px;
  color: #0ea5e9;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
}
.step-number span {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 400;
}
h2 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 21px;
  font-weight: 600;
}
.bubble-body {
  margin: 0;
  color: #64748b;
  line-height: 1.9;
}
.bubble-hint {
  margin: 14px 0 0;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 12px;
}
.project-name {
  display: block;
  margin-top: 16px;
  font-size: 12px;
}
.project-name input {
  display: block;
  margin-top: 6px;
  padding: 9px 11px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
}
.project-name small {
  display: block;
  margin-top: 7px;
  color: #64748b;
  font-size: 11px;
}
.publish-animation {
  gap: 7px;
  margin-top: 16px;
  padding: 15px 8px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
}
.animated-publish {
  position: relative;
  padding: 5px;
  background: #e0f2fe;
  color: #0284c7;
  border-radius: 5px;
}
.animated-publish svg {
  position: absolute;
  right: -4px;
  bottom: -10px;
  animation: tour-click 2s ease-in-out infinite;
}
.data-links {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.data-links button {
  padding: 7px 10px;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0284c7;
}
.step-dots {
  display: flex;
  gap: 6px;
  margin: 22px 0;
}
.step-dots span {
  flex: 1;
  height: 3px;
  border-radius: 4px;
  background: #e2e8f0;
}
.step-dots .done {
  background: #38bdf8;
}
.tour-back {
  color: #64748b;
  padding: 9px 0;
}
.tour-next {
  gap: 10px;
  padding: 10px 18px;
  border-radius: 10px;
  background: linear-gradient(120deg, #0ea5e9, #2563eb);
  color: white;
  font-weight: 500;
}
button:disabled {
  cursor: wait;
  opacity: 0.6;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 3px;
}
.skip-tour {
  display: block;
  margin: 14px auto 0;
  color: #94a3b8;
  font-size: 11px;
}
.tour-error {
  color: #be123c;
  font-size: 12px;
  margin-top: 12px;
}
.tour-error button {
  margin-left: 8px;
  text-decoration: underline;
}
@keyframes tour-click {
  0%,
  100% {
    transform: translate(6px, 7px);
    opacity: 0.5;
  }
  50% {
    transform: translate(0, 0);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .animated-publish svg {
    animation: none;
  }
}
</style>
