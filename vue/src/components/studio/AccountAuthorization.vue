<script setup lang="ts">
import { ref, watch } from 'vue';
import { ShieldCheck, ExternalLink } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { accountPlatform, platforms, platformName } from '@/services/accounts';
import type { SocialPlatform } from '@/types/studio';
import { studio, authorize } from '@/services/studio';
import type { TKAccount } from '@/types/studio';
import { toast } from 'vue-sonner';
const props = defineProps<{ open: boolean; account?: TKAccount | null }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const platform = ref<SocialPlatform>('tiktok');
const authStep = ref(0),
  handle = ref(''),
  authGroup = ref('ungrouped'),
  scenario = ref('成功'),
  error = ref('');
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    platform.value = accountPlatform(props.account ?? undefined);
    authStep.value = 0;
    handle.value = props.account?.handle ?? '';
    authGroup.value = props.account?.groupId ?? 'ungrouped';
    scenario.value = '成功';
    error.value = '';
  },
  { immediate: true },
);
function complete() {
  try {
    if (props.account && (props.account.deleted || !studio.value.accounts.includes(props.account)))
      throw new Error('帐号已不可用，请刷新后重试');
    const name = props.account?.name;
    const account = authorize(handle.value, authGroup.value, scenario.value, platform.value);
    if (name) {
      const stored = studio.value.accounts.find((a) => a.id === account.id);
      if (stored) stored.name = name;
    }
    authStep.value = 2;
    toast.success(`${account.name} 登录状态已更新`);
  } catch (cause) {
    error.value = (cause as Error).message;
  }
}
</script>
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg rounded-2xl bg-white p-7">
      <DialogTitle>连接 {{ platformName(platform) }} 帐号</DialogTitle>
      <DialogDescription>本地模拟授权，不连接真实平台；发布前逐条确认内容。</DialogDescription>
      <div v-if="authStep === 0" class="space-y-5"><label class="block"><span class="studio-label">帐号平台</span><select v-model="platform" :disabled="!!account" aria-label="帐号平台" class="studio-field"><option v-for="p in platforms" :key="p.value" :value="p.value">{{ p.label }}</option></select></label>
        <div class="rounded-xl bg-sky-50 p-4 text-sm leading-7 text-sky-800">
          <ShieldCheck class="mb-2" />
          授权用于读取基本资料、发布内容及在独立授权允许的范围内读取内容数据。你可以随时解除绑定。
        </div>
        <button class="studio-primary w-full" @click="authStep = 1">
          前往 {{ platformName(platform) }} 授权（演示）
          <ExternalLink class="h-4 w-4" />
        </button>
      </div>
      <div v-else-if="authStep === 1" class="space-y-4">
        <p class="text-xs text-slate-400">模拟 {{ platformName(platform) }} 授权回调</p>
        <label class="block">
          <span class="studio-label">{{ platformName(platform) }} 用户名</span>
          <input v-model="handle" :readonly="!!account" class="studio-field" placeholder="@your.brand" />
        </label>
        <label class="block">
          <span class="studio-label">所属分组</span>
          <select v-model="authGroup" class="studio-field">
            <option v-for="g in studio.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </label>
        <label class="block">
          <span class="studio-label">演示结果</span>
          <select v-model="scenario" class="studio-field">
            <option v-for="s in ['成功', '拒绝', '取消', '过期', '权限不足']" :key="s">{{ s }}</option>
          </select>
        </label>
        <p v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
        <button class="studio-primary w-full" @click="complete">完成授权</button>
      </div>
      <div v-else class="py-6 text-center">
        <ShieldCheck class="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h3 class="font-semibold">授权结果已保存</h3>
        <p class="my-4 text-sm text-slate-400">
          {{ account ? '已更新当前帐号的登录状态。' : '下一步：在项目设置中关联帐号，开始发布。' }}
        </p>
        <button class="studio-primary" @click="emit('update:open', false)">完成</button>
      </div>
    </DialogContent>
  </Dialog>
</template>
