<script setup lang="ts">
import { NotebookPen, Sparkles, User, ArrowRight, Trash2 } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { useIdeaNotes } from '@/composables/useIdeaNotes';
import { useInspirationDialog } from '@/composables/useInspirationDialog';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
const { embedded = false } = defineProps<{
  embedded?: boolean;
}>();
const { openInspiration } = useInspirationDialog();
const router = useRouter();
const { notes, removeNote } = useIdeaNotes();
const active = ref<(typeof notes.value)[number] | null>(null);
const remove = (id: string) => {
  removeNote(id);
  toast.success('已删除该妙记');
};
</script>

<template>
  <div>
    <template v-if="!embedded">
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient shadow-md shadow-sky-300/40"
        >
          <NotebookPen class="h-5 w-5 text-white"></NotebookPen>
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="text-lg font-semibold text-slate-800">妙记</h1>
          <p class="text-[12px] text-slate-400">AI 灵感生成的对话自动保存在这里，随时回看你的想法</p>
        </div>
        <Button
          size="sm"
          class="gap-2 brand-gradient px-4 text-white hover:opacity-90"
          @click="openInspiration()"
        >
          <Sparkles class="h-3.5 w-3.5"></Sparkles>
          去聊一条
        </Button>
      </div>
    </template>
    <div v-else class="flex justify-end">
      <Button
        size="sm"
        class="gap-2 brand-gradient px-4 text-white hover:opacity-90"
        @click="openInspiration()"
      >
        <Sparkles class="h-3.5 w-3.5"></Sparkles>
        去聊一条
      </Button>
    </div>
    <template v-if="notes.length === 0">
      <div class="mt-16 flex flex-col items-center text-center">
        <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <NotebookPen class="h-6 w-6 text-slate-400"></NotebookPen>
        </span>
        <p class="mt-4 text-[14px] font-medium text-slate-700">还没有妙记</p>
        <p class="mt-1 text-[12.5px] text-slate-400">点击「去聊一条」，聊完的方案会自动存到这里</p>
      </div>
    </template>
    <template v-else>
      <div class="mt-6 grid grid-cols-3 gap-4">
        <template :key="n.id" v-for="n in notes">
          <button
            @click="active = n"
            class="glass-card group rounded-2xl border-slate-200 p-5 text-left transition-shadow hover:shadow-md hover:shadow-slate-200/60"
          >
            <div class="flex items-center gap-1.5">
              <Sparkles class="h-3.5 w-3.5 shrink-0 text-sky-500"></Sparkles>
              <span class="text-[11px] text-slate-400">{{ n.time }}</span>
              <span
                role="button"
                :tabIndex="0"
                @click="
                  $event.stopPropagation();
                  remove(n.id);
                "
                class="ml-auto rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 class="h-3.5 w-3.5"></Trash2>
              </span>
            </div>
            <h3 class="mt-2.5 truncate text-[14.5px] font-semibold text-slate-800">
              {{ n.title }}
            </h3>
            <p class="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
              {{ n.summary }}
            </p>
            <div class="mt-3 flex items-center gap-1.5">
              <template :key="p" v-for="p in n.platforms">
                <Badge
                  variant="outline"
                  class="border-sky-200 bg-sky-50 text-[10.5px] font-normal text-sky-600"
                >
                  {{ p }}
                </Badge>
              </template>
              <span
                class="ml-auto flex items-center gap-0.5 text-[11.5px] text-sky-500 opacity-0 transition-opacity group-hover:opacity-100"
              >
                查看对话
                <ArrowRight class="h-3 w-3"></ArrowRight>
              </span>
            </div>
          </button>
        </template>
      </div>
    </template>
    <Dialog :open="!!active" @update:open="if (!$event) active = null;">
      <DialogContent
        class="max-h-[80vh] overflow-y-auto scroll-slim border-slate-200 bg-white p-6 sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle class="text-[16px] text-slate-800">{{ active?.title }}</DialogTitle>
          <DialogDescription class="text-[12px]">{{ active?.time }} · 来自 AI 灵感生成</DialogDescription>
        </DialogHeader>
        <div class="mt-4 space-y-4">
          <template :key="i" v-for="(m, i) in active?.messages">
            <div
              :class="
                m.role === 'ai' ? 'flex items-start gap-2.5' : 'flex flex-row-reverse items-start gap-2.5'
              "
            >
              <span
                :class="
                  m.role === 'ai'
                    ? 'brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white'
                    : 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500'
                "
              >
                <template v-if="m.role === 'ai'"><Sparkles class="h-3.5 w-3.5"></Sparkles></template>
                <template v-else><User class="h-3.5 w-3.5"></User></template>
              </span>
              <p
                :class="
                  m.role === 'ai'
                    ? 'inline-block rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700'
                    : 'inline-block rounded-xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white'
                "
              >
                {{ m.text }}
              </p>
            </div>
          </template>
        </div>
        <Button
          class="mt-6 w-full gap-2 brand-gradient text-white hover:opacity-90"
          @click="router.push('/create')"
        >
          <Sparkles class="h-4 w-4"></Sparkles>
          基于这条妙记去创作
        </Button>
      </DialogContent>
    </Dialog>
  </div>
</template>
