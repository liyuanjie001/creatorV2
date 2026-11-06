<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import type { AgentCard } from '@/types/agent';
const props = defineProps<{ card: AgentCard; readonly?: boolean; structured?: boolean }>();
const card = computed(() => props.card);
const emit = defineEmits<{ action: [name: string, index?: number]; preview: [url: string]; upload: [file: File] }>();
const imageUrl = ref('');
let imageVersion = 0;
watch(() => props.card.imageMediaId, async (id) => {
  const version = ++imageVersion;
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = '';
  if (!id || !currentUser.value) return;
  try {
    const blob = await getMedia(currentUser.value.id, id);
    if (blob && version === imageVersion) imageUrl.value = URL.createObjectURL(blob);
  } catch { /* Missing images retain the upload recovery entry. */ }
}, { immediate: true });
onBeforeUnmount(() => { imageVersion++; if (imageUrl.value) URL.revokeObjectURL(imageUrl.value); });
function uploadFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('upload', file);
  input.value = '';
}
const newPoint = ref('');
function addPoint() {
  const title = newPoint.value.trim();
  if (!title) return;
  const c = props.card;
  const id = crypto.randomUUID();
  c.options.push({ id, title }); c.selected.push(id);
  newPoint.value = ''; emit('action', 'save');
}
const isShot = computed(() => !!props.structured && props.card.module.startsWith('shot-'));
const fieldsEditable = computed(() => editable.value && (!isShot.value || props.card.editingContent));
const editable = computed(() => !props.readonly && ['pending', 'selected'].includes(props.card.status));
const expanded = ref(false);
const statusText = computed(
  () =>
    ({
      pending: '等待操作',
      selected: '正在选择',
      submitted: '已提交',
      confirmed: '已确认',
      locked: '已确认 · 已锁定',
      outdated: '已过期 · 需要重新审核',
      disabled: '历史版本 · 不可操作',
    })[props.card.status],
);
function clearSelection() {
  const value = props.card;
  value.selected = [];
  value.status = 'selected';
  emit('action', 'save');
}
function setFailure(event: Event) {
  const value = props.card;
  value.simulateFailure = (event.target as HTMLInputElement).checked;
  emit('action', 'save');
}
function setWarnings(event: Event) {
  const value = props.card;
  value.acceptedWarnings = (event.target as HTMLInputElement).checked;
  emit('action', 'save');
}
function toggle(id: string) {
  if (!editable.value) return;
  const c = props.card;
  c.selected = c.selected.includes(id)
    ? c.selected.filter((x) => x !== id)
    : c.max === 1
      ? [id]
      : [...c.selected, id];
  c.status = 'selected';
  emit('action', 'save');
}
const valid = computed(
  () =>
    !['single', 'multi', 'image'].includes(props.card.kind) ||
    props.card.qa ||
    (props.card.selected.length >= (props.card.min ?? 1) &&
      props.card.selected.length <= (props.card.max ?? Infinity)),
);
</script>
<template>
  <section
    class="my-2 overflow-hidden rounded-xl border bg-sky-50/70 shadow-sm"
    :class="
      card.status === 'outdated'
        ? 'border-amber-300'
        : card.status === 'locked'
          ? 'border-emerald-200'
          : 'border-sky-100'
    "
    :aria-label="card.title"
    :data-agent-card="card.kind"
  >
    <header class="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-800">{{ card.title }}</h3>
      <span
        class="rounded-full bg-white/80 px-2 py-0.5 text-[11px]"
        :class="
          card.status === 'outdated'
            ? 'text-amber-700'
            : card.status === 'locked'
              ? 'text-emerald-600'
              : 'text-slate-500'
        "
      >
        {{ statusText }} · v{{ card.version }}
      </span>
    </header>
    <div class="space-y-3 bg-white/75 p-4">
      <template v-if="card.kind === 'task'">
        <p class="text-xs text-slate-600">{{ card.taskStatus }} · {{ card.progress ?? 0 }}%</p>
        <progress class="h-2 w-full accent-sky-500" :value="card.progress ?? 0" max="100" />
        <template v-if="!readonly && card.status !== 'outdated'">
          <label v-if="card.taskStatus === '待执行'" class="block text-xs text-slate-500">
            <input :checked="card.simulateFailure" type="checkbox" @change="setFailure" />
            模拟本次执行失败
          </label>
          <button
            v-if="['待执行', '执行失败'].includes(card.taskStatus ?? '')"
            class="studio-primary"
            @click="emit('action', 'execute')"
          >
            {{ card.taskStatus === '执行失败' ? '重新执行' : '执行任务' }}
          </button>
        </template>
      </template>
      <template v-else-if="card.module === 'intent-image'">
        <div class="space-y-3">
          <label v-for="field in card.fields" :key="field.key" class="block space-y-1 text-xs text-slate-600"><span>{{ field.label }}</span><textarea v-if="editable" v-model="field.value" class="studio-field" rows="2" @change="emit('action', 'save')" /><p v-else>{{ field.value || '未提供' }}</p></label>
          <img v-if="imageUrl" :src="imageUrl" alt="上传的产品图" class="max-h-60 w-full rounded-xl bg-slate-50 object-contain" />
          <p v-else class="rounded-xl border border-dashed border-sky-200 bg-sky-50 px-4 py-10 text-center text-sm text-slate-500">上传产品图片，用于生成可确认的资料草稿</p>
          <p v-if="card.imageName" class="text-xs text-slate-500">{{ card.imageName }}</p>
          <div v-if="editable" class="flex flex-wrap items-center gap-3">
            <label class="studio-btn cursor-pointer">{{ imageUrl ? '替换产品图' : '上传产品图' }}<input type="file" class="hidden" accept="image/*" aria-label="上传产品图" @change="uploadFile" /></label>
            <button v-if="card.imageMediaId" class="text-xs text-rose-500" @click="emit('action', 'remove-image')">移除图片</button>
            <button class="studio-primary ml-auto" :disabled="!imageUrl" @click="emit('action', 'submit')">生成产品资料</button>
          </div>
          <button v-else-if="!readonly" class="text-xs text-sky-600" @click="emit('action', 'edit')">修改意图与图片</button>
        </div>
      </template>
      <template v-else-if="card.module === 'product-draft'">
        <p class="text-xs text-amber-700">模拟分析，请确认。草稿不代表真实图片识别。</p>
        <div class="grid items-start gap-5 md:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.2fr)]">
          <img v-if="imageUrl" :src="imageUrl" alt="产品原图" class="max-h-72 w-full rounded-xl border border-slate-100 bg-slate-50 object-contain" />
          <p v-else class="text-xs text-amber-600">原图暂不可用，请返回上传步骤补充。</p>
          <div class="min-w-0 space-y-3">
            <label v-for="field in card.fields" :key="field.key" class="block space-y-1 text-xs text-slate-600"><span>{{ field.label }}</span><input v-if="editable" v-model="field.value" class="studio-field" @change="emit('action', 'save')" /><p v-else class="py-2 text-sm text-slate-800">{{ field.value }}</p></label>
            <p class="text-xs font-medium text-slate-600">产品卖点（可多选）</p>
            <div v-for="option in card.options" :key="option.id" class="flex items-center gap-2 rounded-lg border px-3 py-2" :class="card.selected.includes(option.id) ? 'border-sky-300 bg-sky-50' : 'border-slate-200'">
              <input type="checkbox" :checked="card.selected.includes(option.id)" :disabled="!editable" :aria-label="option.title" @change="toggle(option.id)" />
              <input v-if="editable" v-model="option.title" aria-label="修改卖点" class="min-w-0 flex-1 bg-transparent text-xs outline-none" @change="emit('action', 'save')" /><span v-else class="text-xs">{{ option.title }}</span>
            </div>
            <div v-if="editable" class="flex gap-2"><input v-model="newPoint" class="studio-field min-w-0" placeholder="添加已确认卖点" aria-label="添加产品卖点" @keydown.enter.prevent="addPoint" /><button class="shrink-0 text-xs text-sky-600" @click="addPoint">添加</button></div>
          </div>
        </div>
        <div v-if="!readonly" class="flex flex-wrap gap-3">
          <button v-if="editable" class="studio-primary" :disabled="!card.selected.length" @click="emit('action', 'submit')">确认产品，制定创作方向</button>
          <button v-else class="studio-btn" @click="emit('action', 'edit')">修改产品资料</button>
          <button class="studio-btn" @click="emit('action', 'save-product')">保存为产品卡</button>
        </div>
      </template>
      <template v-else>
        <div
          v-if="card.options.length"
          class="grid gap-2"
          :class="card.options.some((o) => o.image) ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2'"
        >
          <div
            v-for="option in editable || card.kind === 'review'
              ? card.options
              : card.options.filter((o) => card.selected.includes(o.id))"
            :key="option.id"
            class="rounded-lg border p-2"
            :class="card.selected.includes(option.id) ? 'border-sky-500 bg-sky-50' : 'border-slate-200'"
          >
            <button
              v-if="option.image"
              type="button"
              class="block w-full"
              :aria-label="`放大 ${option.title}`"
              @click="emit('preview', option.image)"
            >
              <img :src="option.image" :alt="option.title" class="aspect-video w-full rounded object-cover" />
            </button>
            <button
              type="button"
              class="w-full py-2 text-left text-xs"
              :disabled="!editable || card.kind === 'review'"
              :aria-pressed="card.selected.includes(option.id)"
              @click="toggle(option.id)"
            >
              <span class="font-medium">
                {{ card.selected.includes(option.id) ? '✓ ' : '' }}{{ option.title }}
              </span>
              <span v-if="option.description" class="mt-1 block text-slate-500">
                {{ option.description }}
              </span>
            </button>
          </div>
        </div>
        <label v-if="editable && card.selected.includes('手动输入')" class="block space-y-1 text-xs text-slate-600">手动输入<input v-model="card.customValue" class="studio-field" placeholder="填写你的要求" @input="emit('action', 'save')" /></label>
        <button v-if="isShot && editable" class="text-xs text-sky-600" @click="emit('action', card.editingContent ? 'save-script' : 'edit-script')">{{ card.editingContent ? '保存脚本修改' : '修改脚本' }}</button>
        <div
          v-if="editable && ['multi', 'image'].includes(card.kind) && !card.qa"
          class="flex gap-3 text-xs text-slate-500"
        >
          <span>
            已选择 {{ card.selected.length }} 项（{{ card.min ?? 1 }}–{{ card.max ?? card.options.length }}）
          </span>
          <button @click="clearSelection">全部取消</button>
        </div>
        <button
          v-if="card.fields.length > 3 && !card.module.startsWith('intent-')"
          type="button"
          class="text-xs text-sky-600"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起详情' : '展开详情' }}
        </button>
        <div
          v-for="(field, index) in card.fields"
          v-show="expanded || index < 3"
          :key="field.key"
          class="space-y-1"
          :class="card.kind === 'single' || card.kind === 'multi' || card.kind === 'image' ? 'hidden' : ''"
        >
          <label class="block text-xs font-medium text-slate-600" :for="`${card.id}-${field.key}`">
            {{ field.label }}{{ field.required ? ' *' : '' }}
          </label>
          <template v-if="fieldsEditable">
            <select
              v-if="field.type === 'select'"
              :id="`${card.id}-${field.key}`"
              v-model="field.value"
              class="studio-field"
              @change="emit('action', 'save')"
            >
              <option v-for="value in field.options" :key="value">{{ value }}</option>
            </select>
            <textarea
              v-else-if="field.type === 'textarea'"
              :id="`${card.id}-${field.key}`"
              v-model="field.value"
              class="studio-field min-h-20 py-2 text-xs"
              @change="emit('action', 'save')"
            />
            <input
              v-else
              :id="`${card.id}-${field.key}`"
              v-model="field.value"
              :type="field.type === 'number' ? 'number' : 'text'"
              class="studio-field"
              @change="emit('action', 'save')"
            />
          </template>
          <p v-else class="whitespace-pre-wrap text-xs leading-6 text-slate-700">{{ field.value }}</p>
          <button
            v-if="fieldsEditable && card.kind === 'review'"
            class="text-[11px] text-sky-600"
            @click="emit('action', 'regenerate', index)"
          >
            优化此项
          </button>
        </div>
        <div v-if="card.qa" class="space-y-2 rounded-lg bg-slate-50 p-3">
          <p v-for="q in card.qa" :key="q.label" class="flex justify-between text-xs">
            <span>{{ q.label }}</span>
            <span
              :class="
                q.status === '通过'
                  ? 'text-emerald-600'
                  : q.status === '警告'
                    ? 'text-amber-600'
                    : 'text-rose-600'
              "
            >
              {{ q.status }}
            </span>
          </p>
          <label
            v-if="editable && card.qa.some((q) => q.status === '警告')"
            class="block text-xs text-slate-600"
          >
            <input :checked="card.acceptedWarnings" type="checkbox" @change="setWarnings" />
            已检查并接受警告
          </label>
        </div>
        <p v-if="card.kind === 'form' && card.module === 'render'" class="text-xs text-slate-500">
          每条预计 20 积分 × 所选版本 × 每版数量（演示不扣积分）
        </p>
        <div v-if="card.requiresAsset && editable" class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-2.5">
          <p class="text-xs text-slate-600">{{ card.assetAttached ? '已添加参考素材，方案将结合素材分析。' : '添加产品图片或视频，帮助 Agent 更准确地分析资料。' }}</p>
          <button type="button" class="shrink-0 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100" @click="emit('action', 'upload-asset')">
            {{ card.assetAttached ? '继续添加' : '上传素材' }}
          </button>
        </div>
        <div v-if="!readonly && card.status !== 'disabled'" class="flex flex-wrap items-center gap-3">
          <button
            v-if="editable && card.kind !== 'result' && !isShot"
            class="studio-primary"
            :disabled="!valid"
            @click="emit('action', 'submit')"
          >
            {{
              card.module === 'script-gate' ? '生成视频' : card.module.startsWith('intent-') ? '继续' : card.module === 'render'
                ? '确认并生成'
                : card.kind === 'review' || card.qa
                  ? '继续'
                  : '确认提交'
            }}
          </button>
          <button
            v-if="!editable && card.kind !== 'result'"
            class="text-xs text-sky-600"
            @click="emit('action', 'edit')"
          >
            {{ card.status === 'outdated' ? '重新审核' : '修改' }}
          </button>
          <button
            v-if="['review', 'image'].includes(card.kind) && !card.module.endsWith('gate')"
            class="text-xs text-sky-600"
            @click="emit('action', 'regenerate')"
          >
            重新生成
          </button>
          <template v-if="card.module.startsWith('shot-') && editable">
            <button class="text-xs text-sky-600" @click="emit('action', 'add-shot')">增加镜头</button>
            <button class="text-xs text-slate-500" @click="emit('action', 'move', -1)">上移</button>
            <button class="text-xs text-slate-500" @click="emit('action', 'move', 1)">下移</button>
            <button class="text-xs text-rose-500" @click="emit('action', 'remove-shot')">删除镜头</button>
          </template>
          <button v-if="card.fields.length" class="text-xs text-slate-500" @click="emit('action', 'copy')">
            复制
          </button>
          <button
            v-if="card.fields.length"
            class="text-xs text-slate-500"
            @click="emit('action', 'download')"
          >
            下载演示方案
          </button>
        </div>
        <p v-if="card.status === 'submitted'" class="text-xs text-slate-400">
          用户已完成选择 · 已同步至创作任务
        </p>
        <slot />
      </template>
    </div>
  </section>
</template>
