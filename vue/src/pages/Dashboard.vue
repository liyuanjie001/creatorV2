<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  Plus,
  ArrowRight,
  FolderKanban,
  Sparkles,
  Clapperboard,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@/components/ui';
import { PageHeader } from '@/components/shared';
import ShowcaseCarousel from '@/components/ShowcaseCarousel.vue';
import { toast } from 'vue-sonner';
import { computed, ref } from 'vue';
import { useHomeProjects } from '@/composables/useHomeProjects';
import type { Project } from '@/types/domain';

import { studio } from '@/services/studio';

const router = useRouter();
const { homeProjects, addHomeProject, renameHomeProject, removeHomeProject } = useHomeProjects();
const createOpen = ref(false);
const projectName = ref('');
const creating = ref(false);
const empty = computed(() => homeProjects.value.length === 0);

const renameOpen = ref(false);
const renameTarget = ref<Project | null>(null);
const renameName = ref('');

const deleteOpen = ref(false);
const deleteTarget = ref<Project | null>(null);

const hotHidden = computed(() => studio.value.hiddenHot);
function hideHotVideos() { studio.value.hiddenHot = true; try { localStorage.setItem('chuhai-hide-home-hot-videos', '1'); } catch { toast.error('浏览器存储不可用，推荐显示设置未保存'); } toast.success('已隐藏爆款推荐'); }
function showHotVideos() { studio.value.hiddenHot = false; try { localStorage.removeItem('chuhai-hide-home-hot-videos'); } catch { toast.error('浏览器存储不可用，推荐显示设置未保存'); } }

function openInspiration() {
  void router.push('/inspiration');
}

function coverStyle(color: string) {
  return {
    background: `radial-gradient(circle at 18% 20%, rgba(255,255,255,.35), transparent 36%), linear-gradient(145deg, ${color} 0%, ${color}cc 48%, #0f172a 160%)`,
  };
}

function openProject(id: string) {
  void router.push(`/projects/${id}`);
}

function openCreate() {
  projectName.value = '';
  createOpen.value = true;
}

function createProject() {
  void router.push('/projects/new');
}

function createFirstVersion() {
  const name = projectName.value.trim();
  if (!name) {
    toast.error('请填写项目名称');
    return;
  }
  if (creating.value) return;
  creating.value = true;
  try {
    const item = addHomeProject({ name });
    createOpen.value = false;
    toast.success('项目创建成功', {
      description: `${item.name} · 已进入工作区`,
    });
    void router.replace(`/projects/${item.id}`);
  } finally {
    creating.value = false;
  }
}

function openRename(project: Project) {
  renameTarget.value = project;
  renameName.value = project.name;
  renameOpen.value = true;
}

function confirmRename() {
  const target = renameTarget.value;
  if (!target) return;
  const next = renameName.value.trim();
  if (!next) {
    toast.error('请填写项目名称');
    return;
  }
  const item = renameHomeProject(target.id, next);
  if (!item) {
    toast.error('重命名失败');
    return;
  }
  renameOpen.value = false;
  renameTarget.value = null;
  toast.success('已重命名', { description: item.name });
}

function openDelete(project: Project) {
  deleteTarget.value = project;
  deleteOpen.value = true;
}

function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  removeHomeProject(target.id);
  deleteOpen.value = false;
  deleteTarget.value = null;
  toast.success('项目已移入归档', { description: target.name });
}
</script>

<template>
  <div class="relative flex min-h-[calc(100vh-72px)] flex-col">
    <div class="flex-1 pb-6">
    <details v-if="studio.projects.some(p => p.archived)" class="mb-5 rounded-xl border border-slate-200 p-4 text-xs text-slate-500"><summary class="cursor-pointer">已归档项目（{{ studio.projects.filter(p=>p.archived).length }}）</summary><div v-for="p in studio.projects.filter(p=>p.archived)" :key="p.id" class="mt-3 flex justify-between"><span>{{p.name}}</span><button class="text-sky-600" @click="p.archived=false">恢复项目</button></div></details>
<div v-if="empty" class="mb-5 flex items-center justify-between rounded-xl bg-sky-50 p-4 text-xs text-sky-700"><span>开始使用：① 创建项目 → ② 授权 TK 帐号 → ③ 创作并发布</span><button class="underline" @click="router.push('/accounts')">授权帐号 →</button></div>
    <section v-if="empty">
      <PageHeader title="项目" desc="创建和管理出海内容工作区，从第一版开始跑起来" />
      <Card class="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-none">
        <div class="grid grid-cols-2 items-center gap-12 px-10 py-14">
          <div>
            <span
              class="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-600"
            >
              Roxy出海内容宣发平台
            </span>
            <h2 class="mt-5 text-3xl font-semibold leading-snug tracking-tight text-slate-800">
              还没有项目，
              <br />
              从这里开始创作
            </h2>
            <p class="mt-4 max-w-sm text-[13px] leading-7 text-slate-500">
              填写项目名称即可进入工作区。产品卡、素材和账号可以之后再补，先把第一版跑起来。
            </p>
            <div class="mt-7 flex items-center gap-3">
              <Button class="brand-gradient text-white" @click="openCreate">
                第一版创建
                <ArrowRight class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                class="border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                @click="createProject"
              >
                创建项目
              </Button>
            </div>
            <p class="mt-3 text-[11px] text-slate-400">演示模式 · 创建后可立即进入工作区</p>
          </div>
          <div class="relative rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6">
            <div class="mb-5 flex items-center gap-2 border-b border-sky-100 pb-4">
              <span class="h-2 w-2 rounded-full bg-rose-200" />
              <span class="h-2 w-2 rounded-full bg-amber-200" />
              <span class="h-2 w-2 rounded-full bg-emerald-200" />
              <span class="ml-3 text-[11px] text-slate-400">项目工作区</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md shadow-sky-200"
              >
                <FolderKanban class="h-5 w-5" />
              </div>
              <div>
                <p class="text-[14px] font-medium text-slate-700">GlowUp 美妆出海</p>
                <p class="mt-1 text-[11px] text-slate-400">自由创作 · 产品卡 · 我的作品</p>
              </div>
            </div>
            <div class="mt-5 space-y-2">
              <div
                v-for="item in [
                  { icon: Sparkles, label: '自由创作' },
                  { icon: CreditCard, label: '产品卡' },
                  { icon: Clapperboard, label: '我的作品' },
                ]"
                :key="item.label"
                class="flex items-center gap-2 rounded-xl border border-white bg-white/90 px-4 py-3 shadow-sm"
              >
                <component :is="item.icon" class="h-4 w-4 text-sky-500" />
                <span class="text-[13px] text-slate-600">{{ item.label }}</span>
                <span class="ml-auto text-[11px] text-slate-300">即将开始</span>
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 border-t border-slate-100 bg-slate-50/60 px-10 py-6">
          <div
            v-for="(step, i) in [
              { title: '填写项目名', desc: '第一版只需一个名称，即可生成工作区' },
              { title: '进入工作区', desc: '打开自由创作，用 AI 对话框生成内容' },
              { title: '补充项目资产', desc: '再添加产品卡、素材库和发布账号' },
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
    </section>

    <section v-else>
      <PageHeader title="我的项目" desc="创建和管理出海内容工作区，从第一版开始跑起来">
        <template #extra>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="border-slate-200 text-slate-600 hover:text-slate-800"
              @click="createProject"
            >
              创建项目
            </Button>
            <Button size="sm" class="brand-gradient gap-1.5 text-white hover:opacity-90" @click="openCreate">
              <Sparkles class="h-3.5 w-3.5" />
              第一版创建
            </Button>
          </div>
        </template>
      </PageHeader>
      <div class="flex flex-wrap gap-6">
        <div
          v-for="project in homeProjects"
          :key="project.id"
          class="group relative w-[280px] shrink-0 flex-none overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
        >
          <button class="block w-full text-left" @click="openProject(project.id)">
            <div class="relative h-[168px] overflow-hidden" :style="coverStyle(project.color)">
              <span class="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/25" />
              <span class="absolute -bottom-10 left-10 h-20 w-28 rounded-full bg-black/10" />
            </div>
            <div class="truncate px-4 py-3.5 pr-11 text-[15px] font-medium text-slate-800">
              {{ project.name }}
            </div>
          </button>
          <div class="absolute right-2.5 top-[176px]">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="项目操作"
                  @click.stop
                >
                  <MoreHorizontal class="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-36 border-slate-200 bg-white text-slate-800 shadow-lg">
                <DropdownMenuItem
                  class="cursor-pointer gap-2 focus:bg-slate-50"
                  @click="openRename(project)"
                >
                  <Pencil class="h-3.5 w-3.5 text-slate-400" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="cursor-pointer gap-2 text-rose-500 focus:bg-rose-50 focus:text-rose-600"
                  @click="openDelete(project)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <button
          class="flex h-[220px] w-[280px] shrink-0 flex-none flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400 transition hover:border-sky-300 hover:text-sky-600"
          @click="createProject"
        >
          <Plus class="h-7 w-7" />
          <span class="mt-2.5 text-[14px]">创建项目</span>
        </button>
      </div>
    </section>
    </div>

    <section v-if="!hotHidden" class="mt-auto bg-white pt-6">
      <div class="mb-2 flex items-center justify-between">
        <div>
          <h2 class="text-[14px] font-medium text-slate-800">爆款视频</h2>
          <p class="text-[11px] text-slate-400">海外高热内容，可翻拍为项目素材</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="text-[12px] text-slate-400 transition hover:text-slate-600"
            @click="hideHotVideos"
          >
            隐藏推荐
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[12px] text-sky-600 transition hover:text-sky-700"
            @click="openInspiration"
          >
            查看更多
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div class="-mx-6">
        <ShowcaseCarousel @select="openInspiration" />
      </div>
    </section>
    <div v-else class="mt-auto flex justify-end pt-3">
      <button
        type="button"
        class="text-[12px] text-slate-400 transition hover:text-sky-600"
        @click="showHotVideos"
      >
        显示爆款推荐
      </button>
    </div>

    <Dialog :open="createOpen" @update:open="createOpen = $event">
      <DialogContent class="max-w-md rounded-2xl border-slate-200 bg-white">
        <DialogTitle>第一版创建</DialogTitle>
        <DialogDescription class="text-[13px] leading-6 text-slate-500">
          填写项目名称即可进入工作区，其他信息可以稍后补充。
        </DialogDescription>
        <label class="block text-[12px] font-medium text-slate-600">
          项目名称
          <Input
            v-model="projectName"
            class="mt-1.5 border-slate-200 text-[13px] focus-visible:ring-sky-300"
            placeholder="例如 GlowUp 美妆出海"
            @keydown.enter="createFirstVersion"
          />
        </label>
        <DialogFooter>
          <Button variant="outline" class="border-slate-200" @click="createOpen = false">取消</Button>
          <Button class="brand-gradient text-white hover:opacity-90" @click="createFirstVersion">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="renameOpen" @update:open="renameOpen = $event">
      <DialogContent class="max-w-md rounded-2xl border-slate-200 bg-white">
        <DialogTitle>重命名项目</DialogTitle>
        <DialogDescription class="text-[13px] leading-6 text-slate-500">
          修改后会同步到项目列表与工作区。
        </DialogDescription>
        <label class="block text-[12px] font-medium text-slate-600">
          项目名称
          <Input
            v-model="renameName"
            class="mt-1.5 border-slate-200 text-[13px] focus-visible:ring-sky-300"
            placeholder="输入新的项目名称"
            @keydown.enter="confirmRename"
          />
        </label>
        <DialogFooter>
          <Button variant="outline" class="border-slate-200" @click="renameOpen = false">取消</Button>
          <Button class="brand-gradient text-white hover:opacity-90" @click="confirmRename">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="deleteOpen" @update:open="deleteOpen = $event">
      <DialogContent class="max-w-md rounded-2xl border-slate-200 bg-white">
        <DialogTitle>删除项目</DialogTitle>
        <DialogDescription class="text-[13px] leading-6 text-slate-500">
          确定删除「{{ deleteTarget?.name }}」吗？删除后可在左侧「项目」重新创建。
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" class="border-slate-200" @click="deleteOpen = false">取消</Button>
          <Button class="bg-rose-500 text-white hover:bg-rose-600" @click="confirmDelete">删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
