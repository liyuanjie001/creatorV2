<script setup lang="ts">
import UserSettings from '@/components/studio/UserSettings.vue';
import { MessageCircle, Check } from 'lucide-vue-next';
import {
  Card,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui';
import { PageHeader, CreditsIcon } from '@/components/shared';
import { cn } from '@/lib/utils';
import { computed, ref } from 'vue';

/** 演示：免费用户赠送额度 */
const creditsBalance = 100;
const creditsGifted = 100;
/** 当前额度上限（演示按赠送额度计） */
const creditsTotal = creditsGifted;
const creditsPct = computed(() =>
  creditsTotal <= 0 ? 0 : Math.min(100, Math.round((creditsBalance / creditsTotal) * 100)),
);

type PackKey = 'p50' | 'p100' | 'p490' | 'p1000' | 'custom';

type RechargePack = {
  key: PackKey;
  /** 折后展示价 */
  price: string;
  priceLabel: string;
  /** 原价，无折扣时为 null */
  originalPrice: string | null;
  /** 折扣数字，如 8；无折扣时为 null */
  discountRate: string | null;
  /** 总积分；定制化为 null */
  totalCredits: number | null;
  /** 最多生成视频总数；定制化为 null */
  videoCount: number | null;
  tag?: string;
  custom?: boolean;
};

/** 付费档位（原价 / 折扣 / 折后价 / 积分 / 视频个数） */
const paidPacks: RechargePack[] = [
  {
    key: 'p50',
    price: '¥50',
    priceLabel: '入门充值',
    originalPrice: null,
    discountRate: null,
    totalCredits: 100,
    videoCount: 8,
  },
  {
    key: 'p100',
    price: '¥100',
    priceLabel: '常用档位',
    originalPrice: '¥125',
    discountRate: '8',
    totalCredits: 500,
    videoCount: 38,
  },
  {
    key: 'p490',
    price: '¥490',
    priceLabel: '高产创作',
    originalPrice: '¥700',
    discountRate: '7',
    totalCredits: 2500,
    videoCount: 208,
    tag: '热门推荐',
  },
  {
    key: 'p1000',
    price: '¥1000',
    priceLabel: '重度使用',
    originalPrice: '¥2000',
    discountRate: '5',
    totalCredits: 5500,
    videoCount: 458,
    tag: '高性价比',
  },
];

const customPack: RechargePack = {
  key: 'custom',
  price: '定制化',
  priceLabel: '企业大批量',
  originalPrice: null,
  discountRate: null,
  totalCredits: null,
  videoCount: null,
  custom: true,
};

const popularPack = paidPacks.find((p) => p.key === 'p490')!;

/** 各充值档位底部权益列表 */
const benefits = ['爆款复刻', '批量生成', '输出无水印', '项目管理', '产品卡创建', '素材库'];

const contactOpen = ref(false);
const selectedPack = ref<RechargePack | null>(null);

function openRecharge(pack: RechargePack) {
  selectedPack.value = pack;
  contactOpen.value = true;
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="个人中心" desc="查看积分余额并充值，按档位获取更多 AI 积分" />

    <div class="mx-auto max-w-[1180px] space-y-8">
      <UserSettings />
      <!-- 顶部：我的积分 + 低调定制化 -->
      <div class="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card class="overflow-hidden border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-[13px] font-medium text-slate-500">我的积分</div>
              <div class="mt-2.5 flex items-center gap-2">
                <CreditsIcon class="h-6 w-6" />
                <h2 class="text-2xl font-semibold tabular-nums text-slate-900">
                  {{ creditsBalance.toLocaleString() }}
                </h2>
              </div>
            </div>
            <Button
              size="sm"
              class="brand-gradient shrink-0 px-3.5 text-white hover:opacity-90"
              @click="openRecharge(popularPack)"
            >
              立即充值
            </Button>
          </div>
          <div class="mt-4">
            <div class="mb-1.5 flex items-center justify-between text-[12px] text-slate-400">
              <span>剩余积分</span>
              <span class="tabular-nums">
                {{ creditsBalance.toLocaleString() }} / {{ creditsTotal.toLocaleString() }}
              </span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="brand-gradient h-full rounded-full transition-all"
                :style="{ width: `${creditsPct}%` }"
              />
            </div>
          </div>
        </Card>

        <Card
          class="flex flex-col justify-between border-dashed border-slate-200 bg-slate-50/70 p-4 shadow-none"
        >
          <div>
            <div class="text-[13px] font-medium text-slate-500">定制化</div>
            <p class="mt-2 text-[12.5px] leading-5 text-slate-400">
              企业大批量采购可按需定制积分与用量，联系商务经理单独报价。
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="mt-3 h-8 w-fit border-slate-200 bg-white text-[12.5px] text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800"
            @click="openRecharge(customPack)"
          >
            联系商务
          </Button>
        </Card>
      </div>

      <!-- 积分充值：四个档位 -->
      <section class="space-y-4">
        <h3 class="text-[15px] font-medium text-slate-800">积分充值</h3>
        <div class="grid grid-cols-2 items-stretch gap-3 pt-3 md:grid-cols-4">
          <Card
            v-for="pack in paidPacks"
            :key="pack.key"
            :class="
              cn(
                'relative flex h-full min-w-0 flex-col gap-0 overflow-visible border-slate-200 bg-white p-4 pb-[calc(1rem+100px)] pt-4 shadow-sm shadow-slate-200/30',
                pack.tag === '热门推荐' && 'border-sky-300 ring-1 ring-sky-200',
                pack.tag === '高性价比' && 'border-amber-300 ring-1 ring-amber-200',
              )
            "
          >
            <!-- 推荐标签：卡片顶边居中 -->
            <Badge
              v-if="pack.tag === '热门推荐'"
              class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-sky-500 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm shadow-sky-200"
            >
              热门推荐
            </Badge>
            <Badge
              v-else-if="pack.tag === '高性价比'"
              class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-amber-500 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm shadow-amber-200"
            >
              高性价比
            </Badge>

            <!-- 套餐说明：右上角 -->
            <span class="absolute right-3 top-3 text-[11px] leading-none text-slate-400">
              {{ pack.priceLabel }}
            </span>

            <!-- 固定高度，保证下方总积分/按钮对齐 -->
            <div class="flex min-h-[3.75rem] flex-col justify-end gap-1.5 pt-4">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="text-[30px] font-semibold leading-none tracking-tight text-slate-900">
                  {{ pack.price }}
                </span>
                <span
                  v-if="pack.discountRate"
                  class="inline-flex shrink-0 items-baseline rounded-full bg-[#ff2d78] px-3 py-1.5 font-semibold leading-none text-white"
                >
                  <span class="text-[16px] tabular-nums">{{ pack.discountRate }}</span>
                  <span class="text-[12px]">折·限时优惠</span>
                </span>
              </div>
              <div
                v-if="pack.originalPrice"
                class="text-[16px] tabular-nums text-slate-400 line-through"
              >
                {{ pack.originalPrice }}
              </div>
              <div v-else class="h-[24px]" aria-hidden="true" />
            </div>

            <div
              class="mt-3 flex h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 text-center"
            >
              <div class="text-[11px] text-slate-400">总积分</div>
              <div
                class="mt-1 text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900"
              >
                {{ pack.totalCredits!.toLocaleString() }}
              </div>
              <p class="mt-2 text-[11px] leading-4 text-slate-500">
                最多生成视频个数：{{ pack.videoCount }}
              </p>
              <p class="mt-0.5 text-[10.5px] text-slate-400">10s 480p</p>
            </div>

            <Button
              size="sm"
              :class="
                cn(
                  'mt-4 w-full shrink-0',
                  pack.tag === '热门推荐' && 'brand-gradient text-white hover:opacity-90',
                  pack.tag === '高性价比' &&
                    'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
                  !pack.tag && 'border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-600',
                )
              "
              :variant="pack.tag === '热门推荐' ? 'default' : 'outline'"
              @click="openRecharge(pack)"
            >
              充值
            </Button>

            <ul class="mt-4 space-y-2">
              <li
                v-for="item in benefits"
                :key="item"
                class="flex items-start gap-1.5 text-[12px] leading-4 text-slate-600"
              >
                <Check class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" stroke-width="2.5" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>

    <Dialog v-model:open="contactOpen">
      <DialogContent class="max-w-sm rounded-2xl border-slate-200 bg-white p-7 text-center">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"
        >
          <MessageCircle class="h-6 w-6" />
        </div>
        <DialogTitle class="mt-3 text-[18px] text-slate-900">添加企业微信联系商务经理</DialogTitle>
        <DialogDescription class="mt-1.5 text-[13px] leading-5 text-slate-500">
          <template v-if="selectedPack?.custom">定制化方案请扫码添加商务经理沟通需求。</template>
          <template v-else-if="selectedPack">
            已选「{{ selectedPack.price }}」充值档位，扫码添加后由商务经理协助完成充值。
          </template>
          <template v-else>扫码添加企业微信，由商务经理协助完成积分充值。</template>
        </DialogDescription>

        <div
          class="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
        >
          <img
            src="/wecom-qr.png"
            alt="企业微信二维码"
            class="h-full w-full object-contain"
          />
        </div>

        <p class="mt-4 text-[12.5px] leading-5 text-slate-400">
          使用微信扫一扫添加企业微信，备注充值档位即可。
        </p>
      </DialogContent>
    </Dialog>
  </div>
</template>
