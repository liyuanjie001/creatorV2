<script setup lang="ts">
import { computed, ref } from 'vue';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';
import { Search, ChevronRight, CircleHelp, MessageSquare, ImagePlus, X } from 'lucide-vue-next';
import { Card, Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import {
  feedbackRecords,
  feedbackTypes,
  feedbackReadError,
  saveFeedback,
  type Feedback,
} from '@/services/feedback';
import { toast } from 'vue-sonner';
import { feedbackImageLimit, prepareFeedbackImage, type FeedbackImage } from '@/services/feedbackImages';
const categories = ['全部', '套餐', '积分', '账号使用权', '创作发布', '账号安全'];
const faqs = [
  {
    category: '套餐',
    question: '如何查看和升级我的套餐？',
    answer:
      '在“我的权益”查看当前版本，点击“升级套餐”前往套餐购买页。已完成的套餐订单决定当前版本，购买较低版本不会降级，单独充值积分不会改变版本。',
  },
  {
    category: '套餐',
    question: '可以选择不包含账号吗？',
    answer:
      '可以。在套餐卡片或支付弹窗取消勾选账号使用权，整档账号将兑换为对应积分，支付金额保持不变，不支持部分兑换。',
  },
  {
    category: '积分',
    question: '如何单独充值积分？',
    answer: '从“我的权益”点击“积分充值”，选择档位并完成支付。积分充值只增加积分，不增加账号或改变套餐版本。',
  },
  {
    category: '积分',
    question: '支付成功但余额没有更新怎么办？',
    answer:
      '请先刷新页面并检查当前登录账号。演示数据按用户保存在当前浏览器中，重复确认同一订单不会重复入账；请勿为恢复余额重复购买。',
  },
  {
    category: '账号使用权',
    question: '购买的账号在哪里查看？',
    answer:
      '包含账号的新订单支付成功后，美国 TikTok 账号使用权会自动添加至“帐号管理”，无需领取。可查看演示登录凭据，账号初始未分组，可跨项目使用。',
  },
  {
    category: '账号使用权',
    question: '历史待领取账号如何处理？',
    answer:
      '历史订单继续保留原领取方式。存在历史剩余额度时，“帐号管理”会显示历史领取入口，可选择平台、国家地区和数量。',
  },
  {
    category: '账号使用权',
    question: '账号同步失败需要重新购买吗？',
    answer:
      '不需要。支付账本已保存，返回支付弹窗点击重试，或刷新、重新登录即可尝试恢复同步。重试不会再次扣款或充值。',
  },
  {
    category: '创作发布',
    question: '如何开始内容创作和发布？',
    answer:
      '进入项目添加产品和素材，选择快速创作或智能创作；确认内容后选择发布账号，检查授权状态与发布设置，再提交发布。',
  },
  {
    category: '创作发布',
    question: '发布失败后该怎么办？',
    answer:
      '在项目的发布列表查看失败原因，检查账号授权、素材及发布配置后重试。当前为演示环境，显示的发布结果不代表真实平台交付。',
  },
  {
    category: '账号安全',
    question: '如何修改昵称和密码？',
    answer:
      '进入“账号中心”修改昵称；独立邮箱或手机账号可通过演示验证码修改密码。Google 登录请在 Google 管理密码，演示账号不支持修改密码。',
  },
  {
    category: '账号安全',
    question: '反馈会发送给客服吗？',
    answer:
      '当前反馈仅保存在本机浏览器，不会发送客服，也不会生成客服回复。清除浏览器数据可能导致本地记录丢失。',
  },
];
const activeTab = ref('feedback');
const search = ref('');
const category = ref('全部');
const filtered = computed(() =>
  faqs.filter(
    (item) =>
      (category.value === '全部' || item.category === category.value) &&
      `${item.question}${item.answer}`.includes(search.value.trim()),
  ),
);
const type = ref<string>(feedbackTypes[0]);
const description = ref('');
const contact = ref('');
const error = ref('');
const saving = ref(false);
const images = ref<FeedbackImage[]>([]);
const imageInput = ref<HTMLInputElement>();
const imageLoading = ref(false);
const imageError = ref('');
const previewImage = ref<FeedbackImage | null>(null);
const previewOpen = ref(false);
const selected = ref<Feedback | null>(null);
const detailOpen = ref(false);
const formatDate = (date: string) =>
  new Date(date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
function submit() {
  if (saving.value || imageLoading.value) return;
  saving.value = true;
  error.value = '';
  try {
    saveFeedback(type.value, description.value, contact.value, images.value);
    description.value = '';
    contact.value = '';
    images.value = [];
    imageError.value = '';
    toast.success('已保存到本地，尚未发送客服');
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
async function addImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length || imageLoading.value) return;
  imageError.value = '';
  if (images.value.length + files.length > feedbackImageLimit) {
    imageError.value = '最多添加 3 张图片，请重新选择';
    return;
  }
  imageLoading.value = true;
  try {
    const added = [];
    for (const file of files) added.push(await prepareFeedbackImage(file));
    images.value.push(...added);
  } catch (e) {
    imageError.value = (e as Error).message;
  } finally {
    imageLoading.value = false;
  }
}
function preview(image: FeedbackImage) {
  previewImage.value = image;
  previewOpen.value = true;
}
function view(record: Feedback) {
  selected.value = record;
  detailOpen.value = true;
}
</script>
<template>
  <TabsRoot v-model="activeTab" class="space-y-5">
    <TabsList class="flex gap-6 border-b border-slate-200" aria-label="帮助与反馈">
      <TabsTrigger
        v-for="tab in [
          { value: 'feedback', label: '用户反馈' },
          { value: 'help', label: '帮助中心' },
        ]"
        :key="tab.value"
        :value="tab.value"
        class="-mb-px border-b-2 border-transparent px-1 pb-3 pt-1 text-sm font-medium text-slate-500 transition hover:text-sky-600 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent value="help" class="focus-visible:outline-sky-500">
      <Card class="gap-5 p-5 sm:p-7">
        <div>
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <CircleHelp class="h-5 w-5 text-sky-500" />
            帮助中心
          </h2>
          <p class="mt-2 text-xs text-slate-500">查找常见问题，快速了解产品使用方式。</p>
        </div>
        <div class="relative">
          <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            v-model="search"
            aria-label="搜索常见问题"
            class="studio-field w-full !pl-9"
            type="search"
            placeholder="搜索套餐、账号、发布等问题"
          />
        </div>
        <div class="flex flex-wrap gap-2" aria-label="帮助分类">
          <button
            v-for="item in categories"
            :key="item"
            type="button"
            :aria-pressed="category === item"
            class="rounded-full px-3 py-1.5 text-xs focus-visible:outline-sky-500"
            :class="
              category === item ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            "
            @click="category = item"
          >
            {{ item }}
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          <details v-for="faq in filtered" :key="faq.question" class="group py-4">
            <summary
              class="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium text-slate-700 focus-visible:outline-sky-500"
            >
              {{ faq.question }}
              <ChevronRight
                class="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>
            <p class="mt-3 text-xs leading-7 text-slate-500">{{ faq.answer }}</p>
          </details>
        </div>
        <p v-if="!filtered.length" role="status" class="py-5 text-center text-sm text-slate-400">
          未找到相关问题，试试其他关键词或填写反馈。
        </p>
      </Card>
    </TabsContent>
    <TabsContent
      value="feedback"
      class="grid items-start gap-5 focus-visible:outline-sky-500 xl:grid-cols-[minmax(0,1fr)_220px]"
    >
      <Card class="min-w-0 gap-5 p-5 sm:p-7">
        <h2 class="flex items-center gap-2 text-base font-semibold">
          <MessageSquare class="h-5 w-5 text-sky-500" />
          提交反馈
        </h2>
        <p class="rounded-xl bg-sky-50 p-3 text-xs leading-6 text-sky-700">
          反馈仅保存在本机，尚未发送客服。请勿填写密码、验证码或账号凭据。
        </p>
        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="feedback-type" class="mb-2 block text-sm">问题类型</label>
            <select id="feedback-type" v-model="type" class="studio-field w-full">
              <option v-for="item in feedbackTypes" :key="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label for="feedback-description" class="mb-2 block text-sm">问题描述</label>
            <textarea
              id="feedback-description"
              v-model="description"
              class="studio-field !h-32 w-full resize-y !py-3"
              required
              minlength="10"
              maxlength="2000"
              placeholder="请描述遇到的问题或建议（10—2,000 字）"
              aria-describedby="feedback-count"
            />
            <p id="feedback-count" class="mt-1 text-right text-xs text-slate-400">
              {{ description.length }} / 2,000
            </p>
          </div>
          <div>
            <p id="feedback-images-label" class="mb-2 text-sm">图片附件（选填）</p>
            <div role="group" aria-labelledby="feedback-images-label" class="flex flex-wrap gap-3">
              <div v-for="(image, index) in images" :key="index" class="relative h-20 w-20">
                <button
                  type="button"
                  :aria-label="`预览图片 ${index + 1}：${image.name}`"
                  class="h-full w-full overflow-hidden rounded-xl border border-slate-200 focus-visible:outline-sky-500"
                  @click="preview(image)"
                >
                  <img :src="image.dataUrl" :alt="image.name" class="h-full w-full object-cover" />
                </button>
                <button
                  type="button"
                  :aria-label="`删除图片 ${index + 1}`"
                  :disabled="imageLoading || saving"
                  class="absolute -right-1.5 -top-1.5 rounded-full bg-slate-600 p-1 text-white hover:bg-rose-500 focus-visible:outline-sky-500 disabled:opacity-50"
                  @click="images.splice(index, 1)"
                >
                  <X class="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
              <button
                v-if="images.length < feedbackImageLimit"
                type="button"
                :disabled="imageLoading || saving || !!feedbackReadError"
                class="flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-sky-500 disabled:opacity-50"
                @click="imageInput?.click()"
              >
                <ImagePlus class="h-5 w-5" aria-hidden="true" />
                {{ imageLoading ? '处理中…' : '上传图片' }}
              </button>
            </div>
            <input
              ref="imageInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              class="sr-only"
              tabindex="-1"
              aria-label="选择反馈图片"
              :disabled="imageLoading || saving || !!feedbackReadError"
              @change="addImages"
            />
            <p class="mt-2 text-xs leading-6 text-slate-400">
              最多 3 张，单张不超过 5 MB，支持 JPG、PNG、WebP。图片将压缩后保存在本机。
            </p>
            <p v-if="imageLoading" role="status" class="mt-1 text-xs text-sky-600">正在处理图片…</p>
            <p v-if="imageError" role="alert" class="mt-1 text-xs text-rose-600">{{ imageError }}</p>
          </div>
          <div>
            <label for="feedback-contact" class="mb-2 block text-sm">联系方式（选填）</label>
            <input
              id="feedback-contact"
              v-model="contact"
              class="studio-field w-full"
              maxlength="100"
              placeholder="邮箱或手机号"
            />
          </div>
          <p v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
          <Button type="submit" :disabled="saving || imageLoading || !!feedbackReadError">
            {{ saving ? '保存中…' : '保存反馈' }}
          </Button>
        </form>
      </Card>
      <Card class="items-center gap-3 p-5 text-center xl:col-start-2 xl:row-start-1" aria-label="联系客服">
        <h2 class="text-base font-semibold text-slate-800">联系客服</h2>
        <p class="text-xs leading-6 text-slate-500">扫码添加企业微信，咨询使用问题</p>
        <img
          src="/wecom-qr.png"
          alt="联系客服企业微信二维码"
          class="h-[176px] w-[176px] max-w-full rounded-xl border border-slate-100 bg-white object-contain p-2"
        />
        <p class="text-xs leading-6 text-slate-400">
          本地反馈不会自动发送给客服，
          <br />
          可添加后发送问题描述和截图。
        </p>
      </Card>
      <Card class="min-w-0 gap-4 p-5 sm:p-7 xl:col-start-1" aria-label="本地反馈记录">
        <h2 class="text-base font-semibold">本地反馈记录</h2>
        <p v-if="feedbackReadError" role="alert" class="text-xs text-rose-600">{{ feedbackReadError }}</p>
        <p v-if="!feedbackRecords.length" class="py-5 text-center text-sm text-slate-400">暂无反馈记录</p>
        <button
          v-for="record in feedbackRecords"
          :key="record.id"
          class="w-full rounded-xl border border-slate-100 p-4 text-left hover:bg-slate-50 focus-visible:outline-sky-500"
          @click="view(record)"
        >
          <span class="block text-xs text-slate-400">
            {{ record.type }} · {{ formatDate(record.createdAt) }}
          </span>
          <span class="mt-2 block truncate text-sm text-slate-700">{{ record.description }}</span>
          <span v-if="record.images?.length" class="mt-2 block text-xs text-slate-500">
            {{ record.images.length }} 张图片附件
          </span>
          <span class="mt-2 block text-xs text-amber-600">已保存到本地，尚未发送客服</span>
        </button>
      </Card>
    </TabsContent>
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto bg-white">
        <DialogTitle>反馈详情</DialogTitle>
        <DialogDescription>已保存到本地，尚未发送客服</DialogDescription>
        <template v-if="selected">
          <p class="text-xs text-slate-400">{{ selected.type }} · {{ formatDate(selected.createdAt) }}</p>
          <p class="whitespace-pre-wrap break-words text-sm leading-7">{{ selected.description }}</p>
          <div v-if="selected.images?.length" class="flex flex-wrap gap-3" aria-label="反馈图片附件">
            <button
              v-for="(image, index) in selected.images"
              :key="index"
              type="button"
              :aria-label="`预览附件 ${index + 1}：${image.name}`"
              class="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 focus-visible:outline-sky-500"
              @click="preview(image)"
            >
              <img :src="image.dataUrl" :alt="image.name" class="h-full w-full object-cover" />
            </button>
          </div>
          <p class="break-all text-xs text-slate-500">联系方式：{{ selected.contact || '未填写' }}</p>
        </template>
        <Button variant="outline" @click="detailOpen = false">关闭</Button>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="previewOpen">
      <DialogContent class="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto bg-white">
        <DialogTitle>图片预览</DialogTitle>
        <DialogDescription class="break-all">{{ previewImage?.name }}</DialogDescription>
        <img
          v-if="previewImage"
          :src="previewImage.dataUrl"
          :alt="previewImage.name"
          class="max-h-[65dvh] w-full object-contain"
        />
        <Button variant="outline" @click="previewOpen = false">关闭预览</Button>
      </DialogContent>
    </Dialog>
  </TabsRoot>
</template>
