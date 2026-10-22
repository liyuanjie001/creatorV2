<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LockKeyhole, Orbit, ArrowRight } from 'lucide-vue-next';
import { Input, Button } from '@/components/ui';
import { accessGate, unlockDestination } from '@/lib/access';

const route = useRoute();
const router = useRouter();
const password = ref('');
const pending = ref(false);
const error = ref('');

async function submit() {
  if (pending.value || !accessGate.isConfigured) return;
  error.value = '';
  pending.value = true;
  try {
    if (!(await accessGate.unlock(password.value))) {
      error.value = '密码不正确，请重新输入';
      return;
    }
    password.value = '';
    await router.replace(unlockDestination(route.query.redirect));
  } catch {
    error.value = '暂时无法校验密码，请刷新页面后重试';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-6 py-12">
    <section class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-8 flex items-center gap-3">
        <div class="brand-gradient flex size-10 items-center justify-center rounded-xl text-white">
          <Orbit class="size-6" />
        </div>
        <div>
          <div class="text-base font-semibold text-slate-800">出海动力</div>
          <p class="text-xs text-slate-400">海外社媒内容工作台</p>
        </div>
      </div>
      <div class="mb-5">
        <LockKeyhole class="mb-3 size-6 text-sky-500" />
        <h1 class="text-xl font-semibold text-slate-900">输入访问密码</h1>
        <p class="mt-2 text-[13px] leading-relaxed text-slate-500">验证一次后，此浏览器将记住访问权限。</p>
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="flex flex-col gap-2">
          <label for="access-password" class="text-[13px] font-medium text-slate-700">访问密码</label>
          <Input
            id="access-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            autofocus
            required
            :disabled="pending || !accessGate.isConfigured"
            :aria-invalid="Boolean(error)"
            aria-describedby="access-error"
            placeholder="请输入访问密码"
            class="h-11 bg-white"
            @input="error = ''"
          />
          <p
            v-if="!accessGate.isConfigured"
            id="access-error"
            role="alert"
            class="text-xs leading-relaxed text-rose-600"
          >
            尚未配置访问密码，请在 .env 中设置 password 后重启服务。
          </p>
          <p v-else-if="error" id="access-error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
        </div>
        <Button
          type="submit"
          :disabled="pending || !password || !accessGate.isConfigured"
          class="brand-gradient h-11 w-full text-white hover:opacity-90"
        >
          {{ pending ? '正在验证…' : '进入工作台' }}
          <ArrowRight v-if="!pending" class="size-4" />
        </Button>
      </form>
    </section>
  </main>
</template>
