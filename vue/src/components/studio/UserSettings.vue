<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { UserRound, Eye, EyeOff } from 'lucide-vue-next';
import { currentUser, identityService, sendCode, codeResendSeconds } from '@/services/identity';
import { Button, Card } from '@/components/ui';
import { toast } from 'vue-sonner';

const router = useRouter();
const nickname = ref('');
watch(
  () => currentUser.value?.name,
  (value) => {
    nickname.value = value ?? '';
  },
  { immediate: true },
);
const nameError = ref('');
const passwordError = ref('');
const savingName = ref(false);
const savingPassword = ref(false);
const code = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const countdown = ref(codeResendSeconds(currentUser.value?.identity ?? ''));
let timer: ReturnType<typeof setInterval> | undefined;
function startCountdown() {
  clearInterval(timer);
  countdown.value = codeResendSeconds(currentUser.value?.identity ?? '');
  if (countdown.value > 0)
    timer = setInterval(() => {
      countdown.value = codeResendSeconds(currentUser.value?.identity ?? '');
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
}
startCountdown();
onBeforeUnmount(() => clearInterval(timer));
const canReset = computed(() => currentUser.value?.id !== 'demo' && currentUser.value?.method !== 'google');
const bindings = computed(() =>
  currentUser.value?.bindings
    .map((item) => ({ email: '邮箱', phone: '手机号', google: 'Google' })[item] ?? item)
    .join('、'),
);
async function saveName() {
  if (savingName.value) return;
  nameError.value = '';
  savingName.value = true;
  try {
    await identityService.updateName(nickname.value);
    toast.success('昵称已保存');
  } catch (error) {
    nameError.value = (error as Error).message;
  } finally {
    savingName.value = false;
  }
}
function send() {
  passwordError.value = '';
  try {
    const user = currentUser.value!;
    sendCode(user.identity, user.method);
    startCountdown();
    toast.info('演示验证码：123456，5 分钟有效');
  } catch (error) {
    passwordError.value = (error as Error).message;
  }
}
async function reset() {
  if (savingPassword.value) return;
  passwordError.value = '';
  if (password.value.length < 8) {
    passwordError.value = '密码至少 8 位';
    return;
  }
  if (password.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致';
    return;
  }
  savingPassword.value = true;
  try {
    await identityService.reset(currentUser.value!.identity, code.value, password.value);
    password.value = '';
    confirmPassword.value = '';
    code.value = '';
    toast.success('密码已修改，下次登录请使用新密码');
  } catch (error) {
    passwordError.value = (error as Error).message;
  } finally {
    savingPassword.value = false;
  }
}
function logout() {
  identityService.logout();
  void router.replace('/auth');
}
</script>

<template>
  <div class="space-y-5">
    <Card class="gap-5 p-5 sm:p-7" aria-label="账号资料">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          >
            <UserRound class="h-7 w-7" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-semibold">账号中心</h2>
            <p class="mt-1 break-words text-sm text-slate-700">{{ currentUser?.name }}</p>
            <p class="mt-1 break-all text-xs text-slate-500">{{ currentUser?.identity }}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="logout">退出登录</Button>
      </div>
      <dl class="grid gap-2 rounded-xl bg-slate-50 p-4 text-xs">
        <dt class="text-slate-400">登录与绑定方式</dt>
        <dd class="text-slate-700">{{ bindings }}</dd>
      </dl>
      <form class="space-y-3" @submit.prevent="saveName">
        <label for="profile-name" class="block text-sm font-medium">昵称</label>
        <input
          id="profile-name"
          v-model="nickname"
          class="studio-field w-full"
          maxlength="30"
          autocomplete="nickname"
          required
          :aria-invalid="!!nameError"
          aria-describedby="name-hint"
        />
        <p id="name-hint" class="text-xs text-slate-400">1—30 个字符，将显示在个人资料中。</p>
        <p v-if="nameError" role="alert" class="text-xs text-rose-600">{{ nameError }}</p>
        <Button type="submit" :disabled="savingName">{{ savingName ? '保存中…' : '保存昵称' }}</Button>
      </form>
    </Card>
    <Card class="gap-5 p-5 sm:p-7">
      <div>
        <h2 class="text-base font-semibold">账号安全</h2>
        <p class="mt-2 text-xs leading-6 text-slate-500">验证身份后修改登录密码。</p>
      </div>
      <form v-if="canReset" class="space-y-4" @submit.prevent="reset">
        <div>
          <label for="profile-code" class="mb-2 block text-sm">验证码</label>
          <div class="flex flex-wrap gap-2">
            <input
              id="profile-code"
              v-model="code"
              class="studio-field min-w-0 flex-1"
              inputmode="numeric"
              autocomplete="one-time-code"
              required
              maxlength="6"
            />
            <Button type="button" variant="outline" :disabled="countdown > 0" @click="send">
              {{ countdown > 0 ? `${countdown} 秒后重发` : '发送验证码' }}
            </Button>
          </div>
          <p class="mt-2 text-xs text-slate-400">使用演示验证码，5 分钟内有效。</p>
        </div>
        <div>
          <label for="profile-password" class="mb-2 block text-sm">新密码</label>
          <div class="flex items-center gap-2">
            <input
              id="profile-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="studio-field min-w-0 flex-1"
              minlength="8"
              autocomplete="new-password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <label for="profile-confirm" class="mb-2 block text-sm">确认新密码</label>
          <input
            id="profile-confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="studio-field w-full"
            minlength="8"
            autocomplete="new-password"
            required
          />
        </div>
        <p v-if="passwordError" role="alert" class="text-xs text-rose-600">{{ passwordError }}</p>
        <Button type="submit" :disabled="savingPassword">
          {{ savingPassword ? '修改中…' : '确认修改密码' }}
        </Button>
      </form>
      <p v-else class="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
        {{
          currentUser?.id === 'demo'
            ? '演示账号可直接体验；注册独立账号后可验证修改密码流程。'
            : '当前通过 Google 登录，请在 Google 账号中管理密码。'
        }}
      </p>
    </Card>
  </div>
</template>
