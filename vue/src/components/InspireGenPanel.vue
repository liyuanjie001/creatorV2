<script setup lang="ts">
import type { OrganizedIdea } from '@/types/domain';
import { useDemoTimers } from '@/composables/useDemoTimers';
const { delay } = useDemoTimers();
import { eventValue } from '@/lib/events';
import { Sparkles, Send, User, ArrowRight } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { addIdeaNote } from '@/data/mock';
import { toast } from 'vue-sonner';
import IdeaCard from '@/components/IdeaCard.vue';
import { useRouter } from 'vue-router';
import { ref, watch } from 'vue';

const variants: OrganizedIdea[] = [
  {
    title: '「户外移动咖啡馆」—— 便携咖啡机露营场景系列',
    positioning: '面向北美 25-35 岁户外爱好者，把「现磨咖啡」从厨房搬到营地，主打便携与仪式感',
    sellingPoints: [
      '3 分钟现磨：比速溶好喝，比手冲省事，营地一键出品',
      '便携收纳：整机 680g，比保温杯还轻，背包侧袋直接塞',
      '出片属性：清晨雾气 + 咖啡蒸汽，天然自带氛围感镜头',
    ],
    recommendPlatforms: ['TikTok', 'Instagram', 'YouTube'],
    format: '短视频（15-30s）+ 图文补充',
    hooks: [
      '「我赌你在营地没喝过这个」—— 悬念开场，第 3 秒给咖啡出品特写',
      'Before/After：速溶 vs 现磨的晨间对比，评论区引导「装备清单」',
      'ASMR 冲泡音 + 篝火白噪音，弱文案强氛围，适合晚间流量池',
    ],
    tags: ['#VanLife', '#CampingCoffee', '#OutdoorLiving', '#咖啡日常'],
    insight: '近 7 天 #CampingCoffee 话题热度上升 42%，竞品内容多为硬广，真实场景感是差异化缺口',
  },
  {
    title: '「办公室第三空间」—— 桌面氛围好物系列',
    positioning: '面向都市白领的办公桌改造内容，把产品植入「高效 + 治愈」的工位场景',
    sellingPoints: [
      '场景共鸣：复刻打工人真实工位，代入感强于棚拍',
      '功能可视化：用「一天的时间线」自然带出 3 个使用 moment',
      '低成本高频率：单场景可批量产出，适合日更账号',
    ],
    recommendPlatforms: ['TikTok', 'X', 'Instagram'],
    format: '剧情短片（30-45s）+ Thread 长帖',
    hooks: [
      '「老板以为我在摸鱼，其实我在……」—— 反转结构，结尾亮产品',
      '「🧵 1/6」拆解我工位上被问爆的 5 个好物，第 4 个是主角',
      '周五 18:00 发「下班仪式感」，蹭周末前情绪流量高峰',
    ],
    tags: ['#DeskSetup', '#OfficeLife', '#打工人', '#工位改造'],
    insight: '#DeskSetup 在欧美职场人群中长期稳定，周四-周五互动率比均值高 18%',
  },
  {
    title: '「一机多用」—— 家用投影仪全家桶场景',
    positioning: '从「参数测评」转向「生活方式提案」，覆盖租房青年、亲子家庭、游戏玩家三类人群',
    sellingPoints: [
      '人群分层：同一产品 3 套脚本，精准匹配不同受众痛点',
      '对比锚点：「电视 vs 投影」的空间对比图直观且有传播性',
      '节点借势：黑五 + 圣诞双节点，促销内容可提前 3 周蓄水',
    ],
    recommendPlatforms: ['YouTube', 'TikTok', 'Facebook'],
    format: '测评长视频（5-8min）+ Shorts 切片',
    hooks: [
      '「租房党别买电视了」—— 人群标签开场，3 秒锁定目标观众',
      '一家三口星空顶之夜：亲子场景弱卖点强情感，女性用户转化高',
      '「200 刀能买到什么投影？」—— 价格锚点开头，中段插入实测',
    ],
    tags: ['#HomeCinema', '#Projector', '#MovieNight', '#黑五攻略'],
    insight: 'YouTube 投影类测评视频平均完播率 41%，「价格锚点」类标题 CTR 高出均值 26%',
  },
];
const quickPrompts = ['便携咖啡机推给北美露营人群', '办公桌改造，想日更', '投影仪黑五预热'];
interface ChatMsg {
  id: number;
  role: 'user' | 'ai';
  text: string;
  idea?: OrganizedIdea;
}
function cnRow(role: 'user' | 'ai') {
  return role === 'ai' ? 'flex items-start gap-2.5' : 'flex flex-row-reverse items-start gap-2.5';
}
function cnAvatar(role: 'user' | 'ai') {
  return role === 'ai'
    ? 'brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white'
    : 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500';
}
function cnBubble(role: 'user' | 'ai') {
  return role === 'ai'
    ? 'inline-block max-w-full rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700'
    : 'inline-block max-w-full rounded-xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white';
}
const emit = defineEmits<{ confirm: [] }>();
const router = useRouter();
const messages = ref<ChatMsg[]>([
  {
    id: 0,
    role: 'ai',
    text: '你好，我是灵感助手 👋 把脑海里零碎的想法直接发给我就行 —— 产品、人群、场景、时间节点都可以，不用完整，我来帮你整合、补充成一份可执行的宣发方案。',
  },
]);
const input = ref('');
const thinking = ref(false);
const round = ref(0);
const idRef = ref(1);
const scrollRef = ref<HTMLDivElement | null>(null);
watch(
  [messages, thinking],
  () => {
    scrollRef.value?.scrollTo({
      top: scrollRef.value.scrollHeight,
    });
  },
  {
    flush: 'post',
  },
);
const send = (text?: string) => {
  const value = (text ?? input.value).trim();
  if (!value || thinking.value) return;
  input.value = '';
  thinking.value = true;
  const userMsg: ChatMsg = {
    id: idRef.value++,
    role: 'user',
    text: value,
  };
  messages.value = [...messages.value, userMsg];
  delay(() => {
    const idea = variants[round.value % variants.length];
    round.value = round.value + 1;
    const aiMsg: ChatMsg = {
      id: idRef.value++,
      role: 'ai',
      text: `收到！基于你提到的「${value.length > 24 ? value.slice(0, 24) + '…' : value}」，我补充了人群、平台与钩子结构，整理出下面这套方案，可以直接采纳或继续追问调整：`,
      idea,
    };
    messages.value = [...messages.value, aiMsg];
    thinking.value = false;
    const now = new Date();
    const time = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    addIdeaNote({
      id: `N-${now.getTime()}`,
      title:
        idea.title
          .split('——')[0]
          .replace(/[「」]/g, '')
          .trim() || idea.title.slice(0, 16),
      summary: idea.positioning,
      time,
      platforms: idea.recommendPlatforms,
      messages: [
        {
          role: 'user',
          text: value,
        },
        {
          role: 'ai',
          text: `${idea.title}：${idea.positioning}。推荐 ${idea.recommendPlatforms.join(' / ')}，形式 ${idea.format}。`,
        },
      ],
    });
    toast.success('已自动保存到妙记');
  }, 1400);
};
const adopt = () => {
  toast.success('已采纳，灵感已同步到自由创作');
  emit('confirm');
  router.push('/create');
};
</script>

<template>
  <div class="flex h-[58vh] flex-col">
    <div
      ref="scrollRef"
      class="flex-1 space-y-4 overflow-y-auto scroll-slim rounded-xl border border-slate-100 bg-slate-50/50 p-4"
    >
      <template :key="m.id" v-for="m in messages">
        <div :class="cnRow(m.role)">
          <span :class="cnAvatar(m.role)">
            <template v-if="m.role === 'ai'"><Sparkles class="h-3.5 w-3.5"></Sparkles></template>
            <template v-else><User class="h-3.5 w-3.5"></User></template>
          </span>
          <div class="min-w-0">
            <p :class="cnBubble(m.role)">{{ m.text }}</p>
            <template v-if="m.idea"><IdeaCard :idea="m.idea" @adopt="adopt"></IdeaCard></template>
          </div>
        </div>
      </template>
      <template v-if="thinking">
        <div class="flex items-start gap-2.5">
          <span :class="cnAvatar('ai')"><Sparkles class="h-3.5 w-3.5"></Sparkles></span>
          <div
            class="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5"
          >
            <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"></span>
            <span
              class="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"
              :style="{
                animationDelay: '0.15s',
              }"
            ></span>
            <span
              class="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400"
              :style="{
                animationDelay: '0.3s',
              }"
            ></span>
          </div>
        </div>
      </template>
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <span class="text-[11.5px] text-slate-400">试试：</span>
      <template :key="q" v-for="q in quickPrompts">
        <button
          @click="send(q)"
          class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
        >
          {{ q }}
        </button>
      </template>
      <button
        @click="router.push('/notes')"
        class="ml-auto flex items-center gap-1 text-[11.5px] text-slate-400 transition-colors hover:text-sky-600"
      >
        查看妙记
        <ArrowRight class="h-3 w-3"></ArrowRight>
      </button>
    </div>
    <div class="mt-2 flex items-center gap-2">
      <Input
        :value="input"
        @input="input = eventValue($event)"
        @keydown="
          if ($event.key === 'Enter') {
            $event.preventDefault();
            send();
          }
        "
        placeholder="描述你的零碎想法，回车发送…"
        class="h-11 flex-1 border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
      ></Input>
      <Button
        @click="send()"
        :disabled="thinking || !input.trim()"
        class="h-11 gap-2 brand-gradient px-5 text-white hover:opacity-90"
      >
        <Send class="h-4 w-4"></Send>
        发送
      </Button>
    </div>
    <p class="mt-2 text-center text-[11px] text-slate-300">
      每次对话生成的方案会自动保存到「妙记」，可在创意中心下方查看
    </p>
  </div>
</template>
