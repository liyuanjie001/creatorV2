<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, CheckCheck } from 'lucide-vue-next';
import { Card, Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import {
  notifications,
  notificationError,
  unreadCount,
  markNotificationsRead,
  type Notification,
} from '@/services/notifications';
import { toast } from 'vue-sonner';
const router = useRouter();
const category = ref('all');
const onlyUnread = ref(false);
const categories = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统' },
  { key: 'purchase', label: '购买' },
];
const filtered = computed(() =>
  notifications.value
    .filter(
      (item) =>
        (category.value === 'all' || item.category === category.value) && (!onlyUnread.value || !item.read),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
);
const selected = ref<Notification | null>(null);
const detailOpen = ref(false);
const formatDate = (date: string) =>
  new Date(date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
function mark(id?: string) {
  try {
    markNotificationsRead(id);
  } catch (error) {
    toast.error((error as Error).message);
  }
}
function view(item: Notification) {
  selected.value = item;
  detailOpen.value = true;
  if (!item.read) mark(item.id);
}
function follow() {
  const action = selected.value?.action;
  if (action === '/me' || action === '/accounts') {
    detailOpen.value = false;
    void router.push(action);
  }
}
</script>
<template>
  <Card class="gap-5 p-5 sm:p-7">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="flex items-center gap-2 text-base font-semibold">
          <Bell class="h-5 w-5 text-sky-500" />
          消息中心
        </h2>
        <p class="mt-2 text-xs text-slate-400">
          {{ unreadCount ? `${unreadCount} 条未读消息` : '所有消息已读' }}
        </p>
      </div>
      <Button variant="outline" size="sm" :disabled="!unreadCount" @click="mark()">
        <CheckCheck class="mr-1.5 h-4 w-4" />
        全部已读
      </Button>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div class="flex gap-1" aria-label="消息分类">
        <button
          v-for="item in categories"
          :key="item.key"
          type="button"
          :aria-pressed="category === item.key"
          class="rounded-lg px-3 py-2 text-xs focus-visible:outline-sky-500"
          :class="
            category === item.key ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-500 hover:bg-slate-50'
          "
          @click="category = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <label class="flex items-center gap-2 text-xs text-slate-500">
        <input v-model="onlyUnread" type="checkbox" class="accent-sky-500" />
        只看未读
      </label>
    </div>
    <p
      v-if="notificationError"
      role="alert"
      class="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-700"
    >
      {{ notificationError }}
    </p>
    <div v-if="!filtered.length" role="status" class="flex flex-col items-center gap-3 py-12 text-slate-400">
      <Bell class="h-8 w-8 text-slate-200" aria-hidden="true" />
      <p class="text-sm">{{ onlyUnread ? '暂无未读消息' : '暂无消息' }}</p>
    </div>
    <article
      v-for="item in filtered"
      :key="item.id"
      class="rounded-xl border p-4"
      :class="item.read ? 'border-slate-100' : 'border-sky-100 bg-sky-50/30'"
      :aria-label="item.title"
    >
      <button class="w-full text-left focus-visible:outline-sky-500" @click="view(item)">
        <span class="flex items-start gap-2">
          <span
            v-if="!item.read"
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"
            aria-label="未读"
          />
          <span class="text-sm font-medium text-slate-800">{{ item.title }}</span>
        </span>
        <span class="mt-2 line-clamp-2 block break-words text-xs leading-6 text-slate-500">
          {{ item.body }}
        </span>
      </button>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <time class="text-slate-400">{{ formatDate(item.createdAt) }}</time>
        <button v-if="!item.read" class="text-sky-600 focus-visible:outline-sky-500" @click="mark(item.id)">
          标记已读
        </button>
        <span v-else class="text-slate-400">已读</span>
      </div>
    </article>
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto bg-white">
        <DialogTitle>{{ selected?.title ?? '消息详情' }}</DialogTitle>
        <DialogDescription>{{ selected ? formatDate(selected.createdAt) : '' }}</DialogDescription>
        <p class="break-words text-sm leading-7 text-slate-600">{{ selected?.body }}</p>
        <Button v-if="selected?.action" @click="follow">{{ selected.actionLabel }}</Button>
        <Button variant="outline" @click="detailOpen = false">关闭</Button>
      </DialogContent>
    </Dialog>
  </Card>
</template>
