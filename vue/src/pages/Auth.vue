<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronLeft, ChevronDown } from 'lucide-vue-next';
import { identityService, sendCode } from '@/services/identity';
import { unlockDestination } from '@/lib/access';
const route = useRoute(); const router = useRouter();
const page = ref<'login' | 'register' | 'reset' | 'google'>('login');
const loginMode = ref<'code' | 'password'>('code');
const identity = ref(''); const prefix = ref('+86'); const password = ref(''); const code = ref(''); const invite = ref(''); const showInvite = ref(false);
const error = ref(''); const notice = ref(''); const busy = ref(false);
const sentTo = ref(''); const resendAt = ref(0); const now = ref(Date.now());
const method = computed(() => page.value !== 'google' && /^\+?\d[\d\s()-]*$/.test(identity.value.trim()) ? 'phone' : 'email');
const international = computed(() => identity.value.trim().startsWith('+'));
const normalized = computed(() => method.value === 'phone' ? (international.value ? '' : prefix.value) + identity.value.replace(/[\s()-]/g, '') : identity.value.trim().toLowerCase());
const countdown = computed(() => sentTo.value === normalized.value ? Math.max(0, Math.ceil((resendAt.value - now.value) / 1000)) : 0);
const needsCode = computed(() => page.value === 'register' || page.value === 'reset' || (page.value === 'login' && loginMode.value === 'code'));
const title = computed(() => ({ login: '登录', register: '创建帐号', reset: '找回密码', google: '使用 Google 继续' }[page.value]));
const subtitle = computed(() => ({ login: '使用手机号或邮箱，继续你的创作', register: '免费注册，开启 AI 视频创作之旅', reset: '验证手机号或邮箱，设置新的登录密码', google: '模拟授权 · 不会连接 Google 服务' }[page.value]));
const timer = setInterval(() => { now.value = Date.now(); }, 1000); onBeforeUnmount(() => clearInterval(timer));
function change(next: typeof page.value) { page.value = next; error.value = ''; notice.value = ''; password.value = ''; code.value = ''; }
function send() {
  try { sendCode(normalized.value, method.value); sentTo.value = normalized.value; now.value = Date.now(); resendAt.value = now.value + 60000; error.value = ''; notice.value = ''; }
  catch (e) { error.value = (e as Error).message; }
}
async function finish() { await router.replace(unlockDestination(route.query.redirect)); }
async function submit() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    if (page.value === 'register') await identityService.register(normalized.value, method.value, password.value, code.value, invite.value.trim());
    else if (page.value === 'reset') { await identityService.reset(normalized.value, code.value, password.value); change('login'); loginMode.value = 'password'; notice.value = '密码已重置，请使用新密码登录'; return; }
    else if (page.value === 'google') await identityService.google(normalized.value, password.value);
    else await identityService.login(normalized.value, password.value, loginMode.value === 'code' ? code.value : undefined);
    await finish();
  } catch (e) { error.value = (e as Error).message; } finally { busy.value = false; }
}
async function demo() { identityService.demo(); await finish(); }
async function googleLogin() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try { await identityService.googleQuick(); await finish(); }
  catch (e) { error.value = (e as Error).message; }
  finally { busy.value = false; }
}
</script>
<template>
  <main class="grid min-h-screen bg-[#f5f7fa] text-slate-700 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
    <section class="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-slate-900 p-12 text-white lg:flex xl:p-16">
      <div class="flex items-center gap-3 text-lg font-semibold"><img src="/favicon.svg" alt="" class="h-10 w-10" />Roxy出海内容宣发平台</div>
      <div class="relative z-10 max-w-xl">
        <span class="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs tracking-wide">CREATE · PUBLISH · GROW</span>
        <h2 class="text-4xl font-semibold leading-[1.35] xl:text-5xl">让好内容，<br>成为品牌的增长动力。</h2>
        <p class="mt-6 max-w-md text-sm leading-7 text-blue-100">从爆款灵感到视频创作，从帐号发布到内容分析，在一个工作空间里完成。</p>
        <div class="mt-10 grid max-w-md grid-cols-3 gap-3"><div v-for="word in ['发现灵感', '轻松创作', '看见增长']" :key="word" class="rounded-xl border border-white/15 bg-white/10 p-4 text-center text-sm">{{ word }}</div></div>
      </div>
      <p class="text-xs text-blue-200">海外社媒内容创作与发布工作空间</p>
    </section>
    <section class="relative flex min-h-screen items-center justify-center px-5 pb-10 pt-24 sm:px-10 sm:pb-10 sm:pt-24">
      <nav v-if="page === 'login' || page === 'register'" aria-label="登录注册" class="absolute right-5 top-6 inline-flex rounded-xl bg-[#eaf0f4] p-1 sm:right-10 sm:top-8 lg:right-12 lg:top-10 xl:right-16">
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-medium transition" :class="page === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'" :aria-pressed="page === 'login'" @click="change('login')">登录</button>
        <button type="button" class="rounded-lg px-5 py-2 text-sm font-medium transition" :class="page === 'register' ? 'bg-white text-sky-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'" :aria-pressed="page === 'register'" @click="change('register')">注册</button>
      </nav>
    <div class="w-full max-w-[440px] rounded-3xl border border-slate-100 bg-white px-7 py-8 shadow-[0_8px_40px_rgba(15,23,42,0.04)] sm:px-10">
      <div class="mb-6 flex items-center justify-center gap-2.5 text-base font-semibold text-slate-800 lg:hidden"><img src="/favicon.svg" alt="" class="h-9 w-9 shrink-0" />Roxy出海内容宣发平台</div>
      <button v-if="page === 'reset' || page === 'google'" type="button" class="mb-5 flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600" @click="change('login')"><ChevronLeft class="h-3.5 w-3.5" />返回登录</button>
      <header class="mb-7 text-center"><h1 class="text-[26px] font-semibold tracking-tight text-slate-900">{{ title }}</h1><p class="mt-2.5 text-[13px] text-slate-400">{{ subtitle }}</p></header>
      <template v-if="page === 'login' || page === 'register'">
        <button type="button" class="studio-btn !h-11 w-full !gap-3 !rounded-xl" :disabled="busy" @click="googleLogin"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.93 3.27-4.77 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88Z"/><path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.85 6.06L5.83 9.9C6.7 7.3 9.13 5.36 12 5.36Z"/></svg>使用 Google {{ page === 'register' ? '注册' : '登录' }}</button>
        <div class="my-6 flex items-center gap-4 text-[11px] text-slate-400"><span class="h-px flex-1 bg-slate-100" />或使用手机号 / 邮箱<span class="h-px flex-1 bg-slate-100" /></div>
      </template>
      <form class="space-y-4" @submit.prevent="submit">
        <div><label for="auth-identity" class="studio-label">{{ page === 'google' ? 'Google 邮箱' : '手机号 / 邮箱' }}</label><div class="flex gap-2">
          <select v-if="method === 'phone' && !international" v-model="prefix" class="studio-field !h-11 !w-24 shrink-0" aria-label="国家区号"><option>+86</option><option>+1</option><option>+44</option><option>+65</option><option>+81</option></select>
          <input id="auth-identity" v-model="identity" class="studio-field !h-11 min-w-0" :type="page === 'google' ? 'email' : 'text'" required :placeholder="page === 'google' ? 'you@gmail.com' : '请输入手机号或邮箱'" autocomplete="username" autocapitalize="none" spellcheck="false" :disabled="busy">
        </div></div>
        <div v-if="needsCode"><label for="auth-code" class="studio-label">验证码</label><div class="flex gap-2"><input id="auth-code" v-model="code" class="studio-field !h-11 min-w-0" placeholder="请输入验证码" required inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button class="studio-btn !h-11 shrink-0 !text-sky-600" :disabled="countdown > 0 || busy" type="button" @click="send">{{ countdown ? `${countdown}s 后重发` : '发送验证码' }}</button></div><p v-if="sentTo === normalized && resendAt > now" role="status" class="mt-2 text-[11px] text-sky-600">演示验证码：123456（5 分钟有效）</p></div>
        <div v-if="!needsCode || page !== 'login'"><label for="auth-password" class="studio-label">{{ page === 'google' ? '已有帐号密码（绑定时填写）' : page === 'login' ? '登录密码' : '设置新密码' }}</label><input id="auth-password" v-model="password" class="studio-field !h-11" type="password" :required="page !== 'google'" :minlength="page === 'login' || page === 'google' ? 1 : 8" :autocomplete="page === 'register' || page === 'reset' ? 'new-password' : 'current-password'" :placeholder="page === 'login' ? '请输入密码' : page === 'google' ? '绑定已有帐号时需验证原密码' : '至少 8 位字符'"></div>
        <div v-if="page === 'login'" class="flex items-center justify-between text-xs"><button v-if="loginMode === 'password'" type="button" class="text-slate-400 hover:text-sky-600" @click="change('reset')">忘记密码？</button><span v-else /><button type="button" class="text-sky-600 hover:text-blue-700" @click="loginMode = loginMode === 'code' ? 'password' : 'code'; error = ''; notice = ''">{{ loginMode === 'code' ? '密码登录' : '验证码登录' }}</button></div>
        <div v-if="page === 'register'"><button type="button" :aria-expanded="showInvite" class="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-600" @click="showInvite = !showInvite"><ChevronDown class="h-3.5 w-3.5 transition" :class="showInvite && 'rotate-180'" />填写邀请码（选填）</button><input v-if="showInvite" v-model="invite" aria-label="邀请码" class="studio-field mt-2" placeholder="请输入邀请码"></div>
        <p v-if="error" role="alert" class="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">{{ error }}</p>
        <p v-if="notice" role="status" class="rounded-xl bg-sky-50 p-3 text-xs leading-5 text-sky-700">{{ notice }}</p>
        <button class="studio-primary !h-11 w-full !rounded-xl" :disabled="busy">{{ busy ? '处理中…' : page === 'register' ? '注册并进入' : page === 'reset' ? '重置密码' : page === 'google' ? '继续（模拟授权）' : '登录' }}</button>
      </form>
      <div v-if="page === 'login' || page === 'register'" class="mt-5 text-center text-xs text-slate-400">
        {{ page === 'register' ? '已有帐号？' : '还没有帐号？' }}
        <button type="button" class="ml-1 rounded px-1 py-0.5 font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700" @click="change(page === 'register' ? 'login' : 'register')">{{ page === 'register' ? '立即登录' : '立即注册' }}</button>
      </div>
    <button type="button" class="mt-5 block w-full text-center text-xs text-slate-500 hover:text-sky-600" @click="demo">先体验一下？进入演示帐号 →</button>
    <p class="mt-3 text-center text-[11px] leading-5 text-slate-400">当前为交互原型 · 验证码与 Google 授权均为模拟</p>
    </div>
    </section>
  </main>
</template>
