<script setup lang="ts">
import { useDemoTimers } from '@/composables/useDemoTimers';
const { delay } = useDemoTimers();
import {
  Sparkles,
  Check,
  Loader2,
  Globe,
  Plus,
  X,
  Upload,
  RotateCcw,
  ArrowRight,
  Wand2,
} from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PageHeader, PlatformBadge } from '@/components/shared';
import { platforms, type Platform } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import Field from '@/components/BrandField.vue';
import { eventValue } from '@/lib/events';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
interface BrandKit {
  name: string;
  website: string;
  colors: string[];
  sellingPoints: string[];
  style: string;
  fonts: string;
  audience: string;
  description: string;
  socials: string;
}
const emptyKit: BrandKit = {
  name: '',
  website: '',
  colors: [],
  sellingPoints: [],
  style: '',
  fonts: '',
  audience: '',
  description: '',
  socials: '',
};
const aiKit: BrandKit = {
  name: 'GlowUp Skincare',
  website: 'glowupbeauty.com',
  colors: ['#0ea5e9', '#f472b6', '#f8fafc', '#0f172a'],
  sellingPoints: ['14 天淡化痘印', '皮肤科测试认证', '满 $50 免运费', '30 天无理由退换'],
  style: '极简、柔和色调、自然光',
  fonts: 'Playfair Display（标题）+ Inter（正文）',
  audience: '25-34 岁北美女性，关注成分与性价比',
  description:
    'GlowUp 是面向北美市场的功效护肤品牌，主打烟酰胺焕肤精华，以临床实证成分与平价策略区别于大牌。',
  socials: 'instagram.com/glowup.beauty · tiktok.com/@glowup.official',
};
const palette = ['#11a3fd', '#1769ff', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6', '#0f172a', '#64748b'];
const aiPlan: {
  platforms: {
    name: Platform;
    reason: string;
  }[];
  contentDirection: string[];
  schedule: {
    phase: string;
    time: string;
    desc: string;
  }[];
  kpi: {
    label: string;
    value: string;
  }[];
} = {
  platforms: [
    {
      name: 'TikTok',
      reason: '美妆品类 CTR 最高，#skincare 热度 +38%',
    },
    {
      name: 'Instagram',
      reason: 'before/after 图文转化效果好',
    },
    {
      name: 'YouTube',
      reason: '承接长测评，提升搜索权重',
    },
  ],
  contentDirection: [
    '以「成分党实测」为主线，前 3 秒产品特写强钩子',
    '搭配 2 条 before/after 对比短片 + 1 条 60 秒深度测评',
    '口播使用美式英语，字幕同步西语覆盖拉美裔人群',
  ],
  schedule: [
    {
      phase: '预热期',
      time: '第 1-3 天',
      desc: '悬念短片 × 3，铺品牌话题',
    },
    {
      phase: '爆发期',
      time: '第 4-7 天',
      desc: '实测视频日更，KOL 合拍跟进',
    },
    {
      phase: '长尾期',
      time: '第 8-14 天',
      desc: 'UGC 二创切片，Coupon 导流',
    },
  ],
  kpi: [
    {
      label: '预期曝光',
      value: '350K+',
    },
    {
      label: '目标互动率',
      value: '≥ 6%',
    },
    {
      label: '发布内容量',
      value: '12-15 条',
    },
  ],
};
const router = useRouter();
const url = ref('');
const mode = ref<'entry' | 'form'>('entry');
const analyzing = ref(false);
const kit = ref<BrandKit>(emptyKit);
const planOn = ref(false);
const picked = ref<Platform[]>([]);
const spInput = ref('');
const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) =>
  (kit.value = {
    ...kit.value,
    [k]: v,
  });
const analyze = (manual: boolean) => {
  if (manual) {
    kit.value = emptyKit;
    planOn.value = false;
    picked.value = [];
    mode.value = 'form';
    return;
  }
  if (!url.value.trim()) {
    toast.error('请输入网站链接');
    return;
  }
  analyzing.value = true;
  delay(() => {
    kit.value = {
      ...aiKit,
      website: url.value.trim(),
    };
    picked.value = aiPlan.platforms.map((p) => p.name);
    planOn.value = true;
    analyzing.value = false;
    mode.value = 'form';
    toast.success('AI 已分析网站并生成品牌套件', {
      description: '所有内容均可编辑，确认后创建项目',
    });
  }, 1800);
};
const completePlan = () => {
  picked.value = aiPlan.platforms.map((p) => p.name);
  planOn.value = true;
  toast.success('AI 已补全宣发方案');
};
const togglePlatform = (p: Platform) =>
  (picked.value = picked.value.includes(p) ? picked.value.filter((x) => x !== p) : [...picked.value, p]);
const create = () => {
  if (!kit.value.name.trim()) {
    toast.error('请填写品牌名称');
    return;
  }
  toast.success('项目创建成功（演示）', {
    description: `${kit.value.name} · 已加入分发队列`,
  });
  router.push('/');
};
</script>

<template>
  <template v-if="mode === 'entry'">
    <div class="mx-auto max-w-xl pt-14">
      <div class="mb-8 text-center">
        <Badge class="mb-4 border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-600">
          ✦ AI 创建
        </Badge>
        <h1 class="text-2xl font-semibold text-slate-800">输入你的网站</h1>
        <p class="mt-2 text-[13.5px] text-slate-500">我们将分析你的业务并生成品牌套件与宣发方案</p>
      </div>
      <Card class="glass-card space-y-3 border-white/[0.07] p-4">
        <div class="relative">
          <Globe
            class="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          ></Globe>
          <Input
            :value="url"
            @input="url = eventValue($event)"
            @keydown="$event.key === 'Enter' && analyze(false)"
            placeholder="www.yourwebsite.com"
            class="h-11 border-slate-200 bg-slate-50 pl-10 text-[14px] focus-visible:ring-sky-300"
          ></Input>
        </div>
        <Button
          :disabled="analyzing"
          @click="analyze(false)"
          class="h-11 w-full gap-2 brand-gradient text-[14px] text-white hover:opacity-90"
        >
          <template v-if="analyzing"><Loader2 class="h-4 w-4 animate-spin"></Loader2></template>
          <template v-else><Sparkles class="h-4 w-4"></Sparkles></template>
          <template v-if="analyzing">{{ 'AI 正在分析你的网站…' }}</template>
          <template v-else>{{ 'AI 分析并创建项目' }}</template>
        </Button>
      </Card>
      <div class="my-5 flex items-center gap-3 text-[12px] text-slate-400">
        <span class="h-px flex-1 bg-slate-200"></span>
        或
        <span class="h-px flex-1 bg-slate-200"></span>
      </div>
      <Button
        variant="outline"
        @click="analyze(true)"
        class="h-11 w-full border-slate-200 bg-white text-[14px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      >
        手动创建品牌套件
      </Button>
    </div>
  </template>
  <template v-else>
    <div class="mx-auto max-w-5xl space-y-5">
      <PageHeader title="创建你的品牌套件" desc="这里的一切都会影响你的宣发内容，所有字段均可编辑">
        <template #extra>
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 border-slate-200 text-slate-500 hover:text-slate-800"
            @click="
              mode = 'entry';
              url = '';
            "
          >
            <RotateCcw class="h-3.5 w-3.5"></RotateCcw>
            重新开始
          </Button>
        </template>
      </PageHeader>
      <div class="grid grid-cols-5 gap-5">
        <Card class="glass-card col-span-2 h-fit space-y-4 border-white/[0.07] p-5">
          <Field label="品牌名称" :ai="!!kit.name">
            <Input
              :value="kit.name"
              @input="set('name', eventValue($event))"
              placeholder="你的品牌名称"
              class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
            ></Input>
          </Field>
          <Field label="网站" :ai="!!kit.website">
            <Input
              :value="kit.website"
              @input="set('website', eventValue($event))"
              placeholder="www.yourwebsite.com"
              class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
            ></Input>
          </Field>
          <Field label="Logo" hint="用于视频片尾与广告角标">
            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-6 text-[12.5px] text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
            >
              <Upload class="h-4 w-4"></Upload>
              上传 Logo
            </button>
          </Field>
          <Field label="品牌色" :ai="kit.colors.length > 0">
            <div class="flex flex-wrap items-center gap-2">
              <template :key="c" v-for="c in kit.colors">
                <span
                  class="group relative h-8 w-8 rounded-full border border-slate-200"
                  :style="{
                    backgroundColor: c,
                  }"
                >
                  <button
                    @click="
                      set(
                        'colors',
                        kit.colors.filter((x) => x !== c),
                      )
                    "
                    class="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-700 text-white group-hover:flex"
                  >
                    <X class="h-2.5 w-2.5"></X>
                  </button>
                </span>
              </template>
              <template v-if="kit.colors.length < 6">
                <div class="flex gap-1.5">
                  <template :key="c" v-for="c in palette.filter((c) => !kit.colors.includes(c)).slice(0, 4)">
                    <button
                      :title="`添加 ${c}`"
                      @click="set('colors', [...kit.colors, c])"
                      class="h-8 w-8 rounded-full border border-dashed border-slate-300 transition-transform hover:scale-110"
                      :style="{
                        backgroundColor: `${c}33`,
                      }"
                    ></button>
                  </template>
                </div>
              </template>
            </div>
          </Field>
        </Card>
        <Card class="glass-card col-span-3 h-fit space-y-4 border-white/[0.07] p-5">
          <Field
            label="卖点"
            hint="用户购买的主要理由，例如：满 $50 免运费"
            :ai="kit.sellingPoints.length > 0"
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <template :key="s" v-for="s in kit.sellingPoints">
                <span
                  class="group inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[12px] text-sky-700"
                >
                  {{ s }}
                  <button
                    @click="
                      set(
                        'sellingPoints',
                        kit.sellingPoints.filter((x) => x !== s),
                      )
                    "
                    class="text-sky-300 hover:text-sky-600"
                  >
                    <X class="h-3 w-3"></X>
                  </button>
                </span>
              </template>
              <div class="flex items-center gap-1">
                <Input
                  :value="spInput"
                  @input="spInput = eventValue($event)"
                  @keydown="
                    if ($event.key === 'Enter' && spInput.trim()) {
                      set('sellingPoints', [...kit.sellingPoints, spInput.trim()]);
                      spInput = '';
                    }
                  "
                  placeholder="添加卖点，回车确认"
                  class="h-7 w-40 border-slate-200 bg-white text-[12px] focus-visible:ring-sky-300"
                ></Input>
                <button
                  @click="
                    if (spInput.trim()) {
                      set('sellingPoints', [...kit.sellingPoints, spInput.trim()]);
                      spInput = '';
                    }
                  "
                  class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500"
                >
                  <Plus class="h-3.5 w-3.5"></Plus>
                </button>
              </div>
            </div>
          </Field>
          <div class="grid grid-cols-2 gap-4">
            <Field label="美学风格" hint="风格调性，例如：极简、柔和色调、自然光" :ai="!!kit.style">
              <Input
                :value="kit.style"
                @input="set('style', eventValue($event))"
                class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
              ></Input>
            </Field>
            <Field label="字体" hint="例如 Playfair Display 和 Inter" :ai="!!kit.fonts">
              <Input
                :value="kit.fonts"
                @input="set('fonts', eventValue($event))"
                class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
              ></Input>
            </Field>
          </div>
          <Field label="受众" hint="宣发内容面向谁" :ai="!!kit.audience">
            <Input
              :value="kit.audience"
              @input="set('audience', eventValue($event))"
              class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
            ></Input>
          </Field>
          <Field label="品牌描述" hint="品牌卖什么、面向谁、有什么不同" :ai="!!kit.description">
            <Textarea
              :value="kit.description"
              @input="set('description', eventValue($event))"
              class="min-h-20 border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
            ></Textarea>
          </Field>
          <Field label="社交账号" hint="Instagram、TikTok 或其他主页链接" :ai="!!kit.socials">
            <Input
              :value="kit.socials"
              @input="set('socials', eventValue($event))"
              class="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
            ></Input>
          </Field>
        </Card>
      </div>
      <template v-if="planOn">
        <div class="flex items-center gap-2 pt-1">
          <Wand2 class="h-4 w-4 text-sky-500"></Wand2>
          <h3 class="text-[15px] font-medium text-slate-800">AI 宣发方案</h3>
          <Badge class="border-0 bg-sky-50 text-[11px] text-sky-600">可调整</Badge>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <Card class="glass-card col-span-2 border-white/[0.07] p-5">
            <h4 class="mb-3 text-[14px] font-medium text-slate-800">推荐平台与理由</h4>
            <div class="space-y-2">
              <template :key="name" v-for="{ name, reason } in aiPlan.platforms">
                <button
                  @click="togglePlatform(name)"
                  :class="
                    cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors',
                      picked.includes(name)
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-slate-200 opacity-55 hover:opacity-80',
                    )
                  "
                >
                  <span
                    :class="
                      cn(
                        'flex h-4 w-4 items-center justify-center rounded border',
                        picked.includes(name) ? 'brand-gradient border-transparent' : 'border-slate-300',
                      )
                    "
                  >
                    <template v-if="picked.includes(name)">
                      <Check class="h-3 w-3 text-white"></Check>
                    </template>
                  </span>
                  <PlatformBadge :platform="name"></PlatformBadge>
                  <span class="text-[12px] text-slate-500">{{ reason }}</span>
                </button>
              </template>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <span class="text-[11.5px] text-slate-400">追加：</span>
              <template
                :key="p"
                v-for="p in platforms.filter((p) => !aiPlan.platforms.some((a) => a.name === p))"
              >
                <button
                  @click="togglePlatform(p)"
                  :class="
                    cn(
                      'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                      picked.includes(p)
                        ? 'border-sky-400 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-400 hover:text-slate-600',
                    )
                  "
                >
                  + {{ p }}
                </button>
              </template>
            </div>
          </Card>
          <div class="space-y-4">
            <Card class="glass-card border-white/[0.07] p-5">
              <h4 class="mb-2.5 text-[14px] font-medium text-slate-800">内容方向</h4>
              <ul class="space-y-2">
                <template :key="i" v-for="(c, i) in aiPlan.contentDirection">
                  <li class="flex items-start gap-2 text-[12px] leading-relaxed text-slate-600">
                    <span
                      class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-semibold text-sky-600"
                    >
                      {{ i + 1 }}
                    </span>
                    {{ c }}
                  </li>
                </template>
              </ul>
            </Card>
            <Card class="glass-card border-white/[0.07] p-5">
              <h4 class="mb-2.5 text-[14px] font-medium text-slate-800">发布排期（14 天）</h4>
              <div class="space-y-2.5">
                <template :key="s.phase" v-for="s in aiPlan.schedule">
                  <div class="flex gap-2.5">
                    <span class="brand-gradient mt-1.5 h-2 w-2 shrink-0 rounded-full"></span>
                    <div>
                      <div class="text-[12.5px] font-medium text-slate-700">
                        {{ s.phase }}
                        <span class="font-normal text-slate-400">{{ s.time }}</span>
                      </div>
                      <div class="text-[11.5px] text-slate-500">
                        {{ s.desc }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </Card>
          </div>
        </div>
      </template>
      <template v-else>
        <button
          @click="completePlan"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 py-5 text-[13.5px] text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          <Sparkles class="h-4 w-4"></Sparkles>
          用 AI 补全宣发方案（平台 / 内容方向 / 排期 / KPI）
        </button>
      </template>
      <div
        class="sticky bottom-4 flex items-center justify-between rounded-2xl border border-sky-100 bg-white/90 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur"
      >
        <p class="text-[12.5px] text-slate-500">
          <template v-if="planOn">
            将创建
            <span class="font-medium text-slate-800">{{ kit.name || '未命名品牌' }}</span>
            项目，绑定 {{ picked.length }} 个平台，预计生成 12-15 条内容
          </template>
          <template v-else>
            创建
            <span class="font-medium text-slate-800">{{ kit.name || '未命名品牌' }}</span>
            品牌套件，宣发方案可稍后再补
          </template>
        </p>
        <Button @click="create" class="gap-2 brand-gradient text-white hover:opacity-90">
          创建项目
          <ArrowRight class="h-4 w-4"></ArrowRight>
        </Button>
      </div>
    </div>
  </template>
</template>
