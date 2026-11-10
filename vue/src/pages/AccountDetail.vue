<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Search, UserRound, Video, Image } from 'lucide-vue-next';
import { studio } from '@/services/studio';
import { loginStatus, accountPlatform, platformName } from '@/services/accounts';
import { accountVideoRows, dateTime, metrics, type VideoRow } from '@/services/videoManagement';
import VideoDetails from '@/components/studio/VideoDetails.vue';
import VideoInfo from '@/components/studio/VideoInfo.vue';
import AccountViewsTrend from '@/components/studio/AccountViewsTrend.vue';
import AccountAuthorization from '@/components/studio/AccountAuthorization.vue';
const route = useRoute(),
  router = useRouter();
const account = computed(() => studio.value.accounts.find((a) => a.id === route.params.id && !a.deleted));
const search = ref(''),
  type = ref(''),
  details = ref<VideoRow | null>(null),
  auth = ref(false);
const projects = computed(() =>
  studio.value.projects.filter((p) => p.accountIds.includes(account.value?.id || '')),
);
const fields = computed(() =>
  account.value
    ? [
        ['地区', account.value.region || '未提供'],
        ['分组', studio.value.groups.find((g) => g.id === account.value?.groupId)?.name || '未分组'],
        ['登录状态', loginStatus(account.value.status)],
        ['备注', account.value.note || '未填写'],
        ['授权时间', dateTime(account.value.authorizedAt)],
      ]
    : [],
);
const formatNumber = (value?: number) =>
  value === undefined ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
const metricDisplay = (row: VideoRow, key: 'views' | 'likes' | 'comments') => {
  const value = metrics(row)?.[key];
  return value === undefined ? '—' : value.toLocaleString('zh-CN');
};
const rows = computed(() =>
  accountVideoRows(studio.value, account.value?.id || '').filter(
    (r) =>
      (!type.value || (r.film?.type || r.content?.type) === type.value) &&
      r.title.toLowerCase().includes(search.value.trim().toLowerCase()),
  ),
);
watch(
  () => account.value?.id,
  () => {
    details.value = null;
    auth.value = false;
    search.value = '';
    type.value = '';
  },
);
function back() {
  const target = String(route.query.returnTo || '/accounts');
  void router.push(target.split('?')[0] === '/accounts' ? target : '/accounts');
}
</script>
<template>
  <div class="space-y-6">
    <button type="button" class="studio-btn" @click="back">
      <ArrowLeft class="h-4 w-4" />
      返回帐号管理
    </button>
    <template v-if="account">
      <section class="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(270px,0.85fr)_minmax(0,1.65fr)]" aria-label="帐号信息">
        <header class="flex flex-wrap items-center gap-3 self-start">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-50 text-2xl font-semibold text-sky-600"
          >
            {{ account.name.slice(0, 1) }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="min-w-0 break-words text-base font-semibold text-slate-800">{{ account.name }}</h1>
              <span class="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                {{ platformName(accountPlatform(account)) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-500">
              {{ account.handle }}
            </p>
            <dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="帐号社交数据">
              <div
                v-for="item in [
                  { label: '关注', value: account.statistics?.following },
                  { label: '粉丝', value: account.statistics?.followers },
                  { label: '点赞', value: account.statistics?.likes },
                ]"
                :key="item.label"
                class="flex items-baseline gap-2"
              >
                <dt class="text-xs text-slate-500">{{ item.label }}</dt>
                <dd class="text-sm font-semibold text-slate-700">{{ formatNumber(item.value) }}</dd>
              </div>
            </dl>
            <p v-if="account.statistics?.mock" class="mt-2 text-[11px] text-slate-400">
              帐号统计为 Mock 演示数据
            </p>
          </div>
          <button
            v-if="account.status !== '已授权'"
            type="button"
            class="studio-primary"
            @click="auth = true"
          >
            立即登录授权
          </button>
        </header>
        <div class="min-w-0 lg:border-l lg:border-slate-100 lg:pl-5">
          <dl class="grid gap-x-4 gap-y-2 sm:grid-cols-3">
            <div v-for="[label, value] in fields" :key="label">
              <dt class="text-xs text-slate-400">{{ label }}</dt>
              <dd class="mt-0.5 break-words whitespace-pre-wrap text-xs text-slate-700">{{ value }}</dd>
            </div>
          </dl>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <p class="text-xs text-slate-400">关联项目</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in projects"
                :key="p.id"
                class="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-700"
                @click="router.push('/projects/' + p.id + '?section=publish')"
              >
                {{ p.name }}{{ p.archived ? '（已归档）' : '' }}
              </button>
              <span v-if="!projects.length" class="text-xs text-slate-500">未关联项目</span>
            </div>
          </div>
        </div>
      </section>
      <AccountViewsTrend :account="account" />
      <section class="space-y-4" aria-label="帐号已发布内容">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="mr-auto font-semibold">
            已发布内容
            <span class="text-xs font-normal text-slate-400">{{ rows.length }} 条</span>
          </h2>
          <label class="relative">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              v-model="search"
              class="studio-field !pl-9"
              aria-label="搜索帐号已发布内容"
              placeholder="搜索发布内容"
            />
          </label>
          <select v-model="type" class="studio-field !w-36" aria-label="已发布内容类型">
            <option value="">全部类型</option>
            <option value="视频">视频</option>
            <option value="图文">图文</option>
          </select>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="studio-table min-w-[680px]" aria-label="帐号已发布列表">
            <thead>
              <tr>
                <th>已发布内容</th>
                <th>类型</th>
                <th>发布时间</th>
                <th>播放量</th>
                <th>点赞</th>
                <th>评论</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td><VideoInfo :row="row" published :rename="false" @open="details = row" /></td>
                <td>
                  <span class="inline-flex items-center gap-1">
                    <Image v-if="(row.film?.type || row.content?.type) === '图文'" class="h-3 w-3" />
                    <Video v-else class="h-3 w-3" />
                    {{ row.film?.type || row.content?.type }}
                  </span>
                </td>
                <td>{{ dateTime(row.date) }}</td>
                <td>{{ metricDisplay(row, 'views') }}</td>
                <td>{{ metricDisplay(row, 'likes') }}</td>
                <td>{{ metricDisplay(row, 'comments') }}</td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="6" class="py-16 text-center text-slate-400">暂无符合条件的已发布内容</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <AccountAuthorization :open="auth" :account="account" @update:open="auth = $event" />
      <VideoDetails player-only :row="details" @close="details = null" />
    </template>
    <div v-else class="py-20 text-center">
      <UserRound class="mx-auto mb-4 h-12 w-12 text-slate-300" />
      <h1 class="text-lg font-semibold">帐号不可用</h1>
      <p class="mt-2 text-sm text-slate-400">帐号不存在或已删除，请返回帐号管理。</p>
    </div>
  </div>
</template>
