<script setup lang="ts">
import { useDemoTimers } from '@/composables/useDemoTimers';
const { delay } = useDemoTimers();
import { eventValue } from '@/lib/events';
import { Send } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ref } from 'vue';
const chatPresets = ['帮我排一下本周发布节奏', '给这个项目写 3 条钩子文案', '分析哪个平台 ROI 最高'];
const chatReplies = [
  '已根据项目周期生成 3 条任务建议，可在「任务」中查看排期（演示）。',
  '好的，我参考了近期热点趋势，建议优先使用悬念式开头，预计 CTR 可提升 18%（演示）。',
  '从当前数据看 TikTok 互动率最高（8.4%），建议加大短视频投放比重（演示）。',
];
const messages = ref<
  {
    role: 'user' | 'ai';
    text: string;
  }[]
>([
  {
    role: 'ai',
    text: '我是项目 AI 助手，了解这个项目的目标、素材和已发布内容。想让我帮你做什么？',
  },
]);
const input = ref('');
const replyIdx = ref(0);
const send = (text: string) => {
  const v = text.trim();
  if (!v) return;
  messages.value = [
    ...messages.value,
    {
      role: 'user',
      text: v,
    },
  ];
  input.value = '';
  delay(() => {
    messages.value = [
      ...messages.value,
      {
        role: 'ai',
        text: chatReplies[replyIdx.value % chatReplies.length],
      },
    ];
    replyIdx.value = replyIdx.value + 1;
  }, 900);
};
</script>

<template>
  <Card class="glass-card flex h-[52vh] flex-col border-slate-200 p-4">
    <div class="flex-1 space-y-3 overflow-y-auto scroll-slim pr-1">
      <template :key="i" v-for="(m, i) in messages">
        <div :class="cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')">
          <div
            :class="
              cn(
                'max-w-[75%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed',
                m.role === 'user'
                  ? 'brand-gradient text-white'
                  : 'border border-slate-100 bg-slate-50 text-slate-700',
              )
            "
          >
            {{ m.text }}
          </div>
        </div>
      </template>
    </div>
    <div class="mt-3 flex flex-wrap gap-1.5">
      <template :key="p" v-for="p in chatPresets">
        <button
          @click="send(p)"
          class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-600"
        >
          {{ p }}
        </button>
      </template>
    </div>
    <div class="mt-2.5 flex items-center gap-2">
      <Input
        :value="input"
        @input="input = eventValue($event)"
        @keydown="if ($event.key === 'Enter') send(input);"
        placeholder="问点与这个项目有关的事…"
        class="h-10 border-slate-200 bg-slate-50 text-[13px] focus-visible:ring-sky-300"
      ></Input>
      <Button @click="send(input)" class="h-10 gap-1.5 brand-gradient px-4 text-white hover:opacity-90">
        <Send class="h-4 w-4"></Send>
        发送
      </Button>
    </div>
  </Card>
</template>
