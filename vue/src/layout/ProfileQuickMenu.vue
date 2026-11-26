<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogOut, UserRound } from 'lucide-vue-next';
import { Avatar, AvatarFallback } from '@/components/ui';
import { profileSections } from '@/lib/profileNavigation';
import { unreadCount } from '@/services/notifications';
import { currentUser, identityService } from '@/services/identity';

const route = useRoute();
const router = useRouter();
const open = ref(false);
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function cancelClose() {
  clearTimeout(closeTimer);
}
function show() {
  cancelClose();
  open.value = true;
}
function close() {
  cancelClose();
  open.value = false;
}
function leave() {
  cancelClose();
  closeTimer = setTimeout(() => {
    if (!root.value?.contains(document.activeElement)) close();
  }, 140);
}
function blur(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) close();
}
async function focusLink(last = false) {
  show();
  await nextTick();
  const links = panel.value?.querySelectorAll<HTMLElement>('a, button');
  links?.[last ? links.length - 1 : 0]?.focus();
}
function escape(event: KeyboardEvent) {
  if (!open.value) return;
  event.preventDefault();
  event.stopPropagation();
  trigger.value?.focus();
  close();
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close();
}
function logout() {
  close();
  identityService.logout();
  void router.replace('/auth');
}
watch(() => route.fullPath, close);
onMounted(() => document.addEventListener('pointerdown', outside));
onBeforeUnmount(() => {
  cancelClose();
  document.removeEventListener('pointerdown', outside);
});
</script>

<template>
  <div
    ref="root"
    class="relative shrink-0"
    @mouseenter="show"
    @mouseleave="leave"
    @focusin="show"
    @focusout="blur"
    @keydown.esc="escape"
  >
    <button
      ref="trigger"
      type="button"
      title="个人中心"
      aria-label="个人中心"
      aria-controls="profile-quick-navigation"
      :aria-expanded="open"
      class="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
      :class="route.path === '/me' || open ? 'bg-sky-50' : 'hover:bg-sky-50'"
      @click="show"
      @keydown.arrow-down.prevent="focusLink()"
      @keydown.arrow-right.prevent="focusLink()"
      @keydown.arrow-up.prevent="focusLink(true)"
    >
      <span
        v-if="unreadCount"
        class="absolute right-0.5 top-0.5 z-10 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
        aria-label="有未读消息"
      />
      <Avatar class="h-9 w-9 border border-slate-200">
        <AvatarFallback class="brand-gradient text-white">
          <UserRound class="h-5 w-5" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
    </button>
    <div v-if="open" class="absolute right-0 top-full w-64 max-w-[calc(100vw-2rem)] pt-2">
      <nav
        id="profile-quick-navigation"
        ref="panel"
        aria-label="个人中心快捷入口"
        class="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
      >
        <div class="mb-1 flex items-center gap-3 border-b border-slate-100 px-3 py-3">
          <Avatar class="h-10 w-10 border border-slate-200">
            <AvatarFallback class="brand-gradient text-white">
              <UserRound class="h-5 w-5" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-900" :title="currentUser?.name">{{ currentUser?.name ?? '用户' }}</p>
            <p class="mt-1 truncate text-xs text-slate-500" :title="currentUser?.identity">{{ currentUser?.identity }}</p>
          </div>
        </div>
        <RouterLink
          v-for="item in profileSections"
          :key="item.key"
          :to="{ path: '/me', query: { section: item.key } }"
          :aria-current="
            route.path === '/me' && (route.query.section ?? 'benefits') === item.key ? 'page' : undefined
          "
          class="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
          :class="
            route.path === '/me' && (route.query.section ?? 'benefits') === item.key
              ? 'bg-sky-50 font-medium text-sky-600'
              : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'
          "
          @click="close"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>
        <div class="border-t border-slate-100 pt-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-rose-500 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
            @click="logout"
          >
            <LogOut class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>退出登录</span>
          </button>
        </div>
      </nav>
    </div>
  </div>
</template>
