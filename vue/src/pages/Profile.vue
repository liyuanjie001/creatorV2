<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { profileSections as sections } from '@/lib/profileNavigation';
import ProfileBenefits from '@/components/studio/ProfileBenefits.vue';
import UserSettings from '@/components/studio/UserSettings.vue';
import HelpFeedback from '@/components/studio/HelpFeedback.vue';
import MessageCenter from '@/components/studio/MessageCenter.vue';
import { unreadCount } from '@/services/notifications';
import { PageHeader } from '@/components/shared';

const route = useRoute();
const activeSection = computed(
  () => sections.find((item) => item.key === route.query.section)?.key ?? 'benefits',
);
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="个人中心" desc="管理个人账号，查看权益、帮助和消息" />
    <div
      class="mx-auto grid min-w-0 gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10"
      :class="activeSection === 'help' ? 'max-w-[1480px]' : 'max-w-[1180px]'"
    >
      <aside class="min-w-0">
        <h2 class="mb-3 text-xs font-medium tracking-wider text-slate-400">设置</h2>
        <nav aria-label="设置" class="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          <RouterLink
            v-for="item in sections"
            :key="item.key"
            :to="{ path: '/me', query: { section: item.key } }"
            :aria-current="activeSection === item.key ? 'page' : undefined"
            class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-3 text-xs transition focus-visible:outline-sky-500 sm:text-sm"
            :class="
              activeSection === item.key
                ? 'bg-sky-50 font-medium text-sky-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            "
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.key === 'messages' && unreadCount"
              aria-label="未读消息数"
              class="ml-auto rounded-full bg-sky-600 px-1.5 text-[10px] leading-5 text-white"
            >
              {{ unreadCount }}
            </span>
          </RouterLink>
        </nav>
      </aside>
      <div class="min-w-0">
        <ProfileBenefits v-if="activeSection === 'benefits'" />
        <UserSettings v-else-if="activeSection === 'account'" />
        <HelpFeedback v-else-if="activeSection === 'help'" />
        <MessageCenter v-else />
      </div>
    </div>
  </div>
</template>
