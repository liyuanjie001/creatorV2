<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { currentUser, identityService, sendCode } from '@/services/identity';
import { toast } from 'vue-sonner';
const router=useRouter();const name=ref(currentUser.value?.name??'');const code=ref('');const password=ref('');const error=ref('');const sent=ref(false);
async function save(){try{await identityService.updateName(name.value);toast.success('个人资料已保存');}catch(e){error.value=(e as Error).message;}}
function send(){try{sendCode(currentUser.value!.identity,currentUser.value!.method);sent.value=true;toast.info('演示验证码：123456，5 分钟有效');}catch(e){error.value=(e as Error).message;}}
async function reset(){try{await identityService.reset(currentUser.value!.identity,code.value,password.value);password.value='';code.value='';toast.success('密码已修改');}catch(e){error.value=(e as Error).message;}}
function logout(){identityService.logout();void router.replace('/auth');}
</script>
<template><section class="studio-card mb-6"><div class="mb-5 flex items-center justify-between"><div><h2 class="font-semibold text-slate-800">个人帐号</h2><p class="mt-2 text-xs text-slate-400">{{currentUser?.identity}} · 绑定方式：{{currentUser?.bindings.join('、')}}</p></div><button class="studio-btn" @click="logout">退出登录</button></div><div class="flex max-w-lg gap-3"><input v-model="name" class="studio-field" aria-label="用户名称"><button class="studio-primary" @click="save">保存名称</button></div><details v-if="currentUser?.id!=='demo'" class="mt-5 text-xs text-slate-500"><summary class="cursor-pointer">修改密码</summary><div class="mt-4 flex flex-wrap gap-3"><input v-model="code" class="studio-field !w-32" placeholder="验证码"><button class="studio-btn" :disabled="sent" @click="send">{{sent?'已发送（5 分钟有效）':'发送验证码'}}</button><input v-model="password" type="password" class="studio-field !w-52" placeholder="新密码，至少 8 位"><button class="studio-primary" @click="reset">确认修改</button></div></details><p v-else class="mt-4 text-xs text-slate-400">演示帐号可直接体验；注册独立帐号后可验证修改密码流程。</p><p v-if="error" role="alert" class="mt-3 text-xs text-rose-500">{{error}}</p></section></template>
