<script setup lang="ts">
import { computed } from 'vue';
import {
  Shapes,
  Trash2,
  Image,
  FileAudio,
  FileText,
  Check,
  RotateCcw,
  AtSign,
  User,
  MapPin,
  Box,
  LayoutTemplate,
  Mic,
  Plus,
  Layers,
} from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { assetElements, deletedAssets, type AssetElement } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import AssetCard from '@/components/assets/AssetCard.vue';
import ElementCard from '@/components/assets/ElementCard.vue';
import AssetTable from '@/components/assets/AssetTable.vue';
const elementKinds: {
  key: '全部' | AssetElement['kind'];
  label: string;
}[] = [
  {
    key: '全部',
    label: '全部',
  },
  {
    key: '角色',
    label: '角色',
  },
  {
    key: '地点',
    label: '地点',
  },
  {
    key: '道具',
    label: '道具',
  },
  {
    key: '模板',
    label: '模板',
  },
  {
    key: '配音',
    label: '配音',
  },
];
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';
const { nav, elemKind, view, selected, list, sections, toggleSelect, toggleSection, showSections } =
  useAssetLibraryContext();
const filteredElements = computed(() =>
  elemKind.value === '全部' ? assetElements : assetElements.filter((e) => e.kind === elemKind.value),
);
const groupedSections = computed(() =>
  sections.value.map((s) => ({
    ...s,
    ids: s.items.map((i) => i.id),
    allSelected: s.items.length > 0 && s.items.every((i) => selected.value.has(i.id)),
  })),
);
</script>

<template>
  <template v-if="nav === 'trash'">
    <div class="mt-6 space-y-2">
      <p class="mb-3 text-[12.5px] text-slate-400">回收站中的素材将在 30 天后自动彻底清除</p>
      <template :key="a.name" v-for="a in deletedAssets">
        <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <template v-if="a.type === '图片'"><Image class="h-4 w-4"></Image></template>
            <template v-else>
              <template v-if="a.type === '音频'"><FileAudio class="h-4 w-4"></FileAudio></template>
              <template v-else><FileText class="h-4 w-4"></FileText></template>
            </template>
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13px] font-medium text-slate-700">
              {{ a.name }}
            </div>
            <div class="text-[11.5px] text-slate-400">
              {{ a.type }} · {{ a.size }} · 删除于 {{ a.updatedAt }}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900"
            @click="toast.success('已恢复（演示）')"
          >
            <RotateCcw class="h-3.5 w-3.5"></RotateCcw>
            恢复
          </Button>
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 border-rose-200 text-[12px] text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            @click="toast.error('已彻底删除（演示）')"
          >
            <Trash2 class="h-3.5 w-3.5"></Trash2>
            彻底删除
          </Button>
        </div>
      </template>
    </div>
  </template>
  <template v-if="nav === 'element'">
    <div class="mt-4 flex items-center gap-1.5">
      <template :key="key" v-for="{ key, label } in elementKinds">
        <button
          @click="elemKind = key"
          :class="
            cn(
              'rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors',
              elemKind === key
                ? 'bg-slate-900 font-medium text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            )
          "
        >
          {{ label }}
        </button>
      </template>
      <Button
        size="sm"
        variant="outline"
        class="ml-auto gap-1.5 rounded-full border-slate-200 text-[12.5px] text-slate-600 hover:text-sky-600"
        @click="toast.success('创建元素（演示）：上传图片或描述，AI 提取特征并生成元素')"
      >
        <Plus class="h-3.5 w-3.5"></Plus>
        创建元素
      </Button>
    </div>
    <template v-if="filteredElements.length > 0">
      <div class="mt-4 grid grid-cols-4 gap-3">
        <template :key="e.id" v-for="e in filteredElements"><ElementCard :e="e"></ElementCard></template>
      </div>
    </template>
    <template v-else>
      <div class="mt-10 flex flex-col items-center">
        <div class="text-[15px] font-semibold text-slate-800">暂无元素</div>
        <p class="mt-1 text-[12.5px] text-slate-400">创建元素，以便在所有项目中保持一致地使用</p>
        <div class="mt-6 grid w-full max-w-3xl grid-cols-3 gap-3">
          <template
            :key="title"
            v-for="{ icon: Icon, hue, title, desc, thumbs } in [
              {
                icon: Shapes,
                hue: 0,
                title: '创建元素',
                desc: '把常用的人物、地点、道具与风格存为元素',
                thumbs: [User, MapPin, Box],
              },
              {
                icon: AtSign,
                hue: 40,
                title: '添加到提示词框',
                desc: '生成时在输入框 @ 引用，自动补全描述',
                thumbs: [Mic, FileText, LayoutTemplate],
              },
              {
                icon: Layers,
                hue: 90,
                title: '用于保持一致性',
                desc: '跨项目复用同一角色、声音与视觉风格',
                thumbs: [User, User, User],
              },
            ]"
          >
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="flex items-center gap-2">
                <component :is="Icon" class="h-4 w-4 text-sky-500"></component>
                <span class="text-[13px] font-medium text-slate-800">{{ title }}</span>
              </div>
              <p class="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
                {{ desc }}
              </p>
              <div class="mt-3 flex gap-1.5">
                <template :key="i" v-for="(T, i) in thumbs">
                  <span
                    :class="
                      cn(
                        'thumb-gradient flex h-14 flex-1 items-center justify-center rounded-lg',
                        hue !== 0 && `[filter:hue-rotate(${hue + i * 15}deg)]`,
                      )
                    "
                  >
                    <component :is="T" class="h-4 w-4 text-white/70"></component>
                  </span>
                </template>
              </div>
            </div>
          </template>
        </div>
        <Button
          class="mt-6 gap-2 brand-gradient px-5 text-white hover:opacity-90"
          @click="toast.success('创建元素（演示）：上传图片或描述，AI 提取特征并生成元素')"
        >
          <Plus class="h-4 w-4"></Plus>
          创建元素
        </Button>
      </div>
    </template>
  </template>
  <template v-if="nav === 'favorite'">
    <div class="mt-5">
      <template v-if="view === 'grid'">
        <div class="grid grid-cols-6 gap-2">
          <template :key="a.id" v-for="a in list">
            <AssetCard :a="a" :selected="selected.has(a.id)" @select="toggleSelect(a.id)"></AssetCard>
          </template>
        </div>
      </template>
      <template v-else>
        <AssetTable :list="list" :selected="selected" @select="toggleSelect"></AssetTable>
      </template>
      <template v-if="list.length === 0">
        <p class="py-16 text-center text-[13px] text-slate-400">没有收藏的素材</p>
      </template>
    </div>
  </template>
  <template v-if="showSections">
    <div class="mt-5 space-y-7">
      <template :key="s.key" v-for="s in groupedSections">
        <section>
          <button
            @click="toggleSection(s.ids)"
            class="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-sky-600"
          >
            <span
              :class="
                cn(
                  'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                  s.allSelected
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-300 bg-white text-transparent',
                )
              "
            >
              <Check class="h-3 w-3" :strokeWidth="3"></Check>
            </span>
            <template v-if="'dot' in s && s.dot">
              <span
                class="h-3 w-3 rounded-[4px]"
                :style="{
                  backgroundColor: s.dot,
                }"
              ></span>
            </template>
            {{ s.key }}
            <span class="text-[11.5px] font-normal text-slate-400">{{ s.items.length }} 项</span>
          </button>
          <template v-if="view === 'grid'">
            <div class="grid grid-cols-6 gap-2">
              <template :key="a.id" v-for="a in s.items">
                <AssetCard :a="a" :selected="selected.has(a.id)" @select="toggleSelect(a.id)"></AssetCard>
              </template>
            </div>
          </template>
          <template v-else>
            <AssetTable :list="s.items" :selected="selected" @select="toggleSelect"></AssetTable>
          </template>
        </section>
      </template>
      <template v-if="sections.length === 0">
        <p class="py-16 text-center text-[13px] text-slate-400">没有符合条件的素材</p>
      </template>
    </div>
  </template>
</template>
