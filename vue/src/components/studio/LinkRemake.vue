<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, Link, Plus } from 'lucide-vue-next';
import RemakeProjectPicker from './RemakeProjectPicker.vue';
import { currentUser } from '@/services/identity';
import { saveMedia } from '@/services/media';
import { parseReference, studio } from '@/services/studio';
import type { Reference } from '@/types/studio';

const router = useRouter();
const url = ref('');
const uploadInput = ref<HTMLInputElement | null>(null);
const scenario = ref('成功');
const error = ref('');
const parsed = ref<Reference | null>(null);
const open = ref(false);
const parsing = ref(false);

async function parse() {
  if (parsing.value) return;
  if (!url.value.trim()) {
    error.value = '请粘贴视频链接，或点击左侧 + 上传视频';
    return;
  }
  parsing.value = true;
  error.value = '';
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    parsed.value = parseReference(url.value, scenario.value);
    open.value = true;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    parsing.value = false;
  }
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  error.value = '';
  try {
    if (!file.type.startsWith('video/')) throw new Error('请选择视频文件');
    if (!currentUser.value) throw new Error('请先登录后再上传视频');
    const id = await saveMedia(currentUser.value.id, file);
    parsed.value = {
      id,
      title: file.name,
      author: '我的参考素材',
      duration: '时长待分析',
      source: '本地上传',
      url: '',
    };
    studio.value.references.unshift(parsed.value);
    open.value = true;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    input.value = '';
  }
}

function go(projectId: string) {
  if (!parsed.value) return;
  void router.push({ path: `/projects/${projectId}`, query: { section: 'gen', mode: 'normal', reference: parsed.value.id } });
}
</script>

<template>
  <section class="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50/30 p-6">
    <div class="mb-4 flex items-center gap-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
        <Link class="h-5 w-5" />
      </span>
      <div>
        <h2 class="text-base font-semibold text-slate-800">用爆款内容，快速生成新视频</h2>
        <p class="mt-1 text-xs leading-5 text-slate-500">粘贴 TikTok / FastMoss 视频链接，或上传本地视频，提取内容结构与节奏，创作新内容。</p>
      </div>
    </div>

    <RemakeProjectPicker v-model:open="open" @select="go">
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
        <button type="button" aria-label="上传视频" title="上传视频" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200" @click="uploadInput?.click()">
          <Plus class="h-5 w-5" />
        </button>
        <input ref="uploadInput" class="hidden" type="file" accept="video/*" @change="upload">
        <input
          v-model="url"
          aria-label="爆款视频链接"
          class="h-10 min-w-0 flex-1 bg-transparent px-2 text-[13px] text-slate-700 outline-none"
          placeholder="粘贴 TikTok / FastMoss 视频链接，或上传本地视频"
          @keydown.enter="parse"
        >
      </div>
      <button class="studio-primary" :disabled="parsing" @click="parse">
        {{ parsing ? '正在解析…' : '开始复刻' }}
        <ArrowRight class="h-4 w-4" />
      </button>
    </div>

    </RemakeProjectPicker>
    <div class="mt-3 flex flex-wrap items-center justify-end gap-2 text-[11px] text-slate-500">
      <label class="flex items-center gap-1">链接解析状态
        <select v-model="scenario" class="rounded bg-transparent text-slate-500">
          <option>成功</option>
          <option>内容失效</option>
          <option>解析失败</option>
        </select>
      </label>
    </div>
    <p v-if="error" role="alert" class="mt-3 text-xs text-rose-600">{{ error }}</p>
  </section>

</template>
