<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, Send, MessageSquare, Trash2, Pencil, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next';
import { studio, startGeneration, blankAttributes } from '@/services/studio';
import { uid, now } from '@/services/storage';
import { toast } from 'vue-sonner';
const props=defineProps<{projectId:string}>();const route=useRoute();const router=useRouter();const input=ref('');const search=ref('');const fail=ref(false);const deleting=ref('');const editTitle=ref('');const renameId=ref('');const seconds=ref('15');const ratio=ref('9:16');const outputType=ref<'视频'|'图文'>('视频');const historyCollapsed=ref(true);
const sessions=computed(()=>studio.value.sessions.filter(s=>s.projectId===props.projectId&&s.title.toLowerCase().includes(search.value.toLowerCase())));
const current=computed(()=>studio.value.sessions.find(s=>s.id===route.query.session&&s.projectId===props.projectId));
const hasStarted=computed(()=>!!current.value?.messages.some(message=>message.role==='user'));
const conversationMessages=computed(()=>current.value?.messages.filter(message=>!message.text.startsWith('你好，我是你的创作搭档。'))??[]);
const directions=['问题开场 · 用痛点抓住注意力','对比实测 · 让变化自己说话','生活叙事 · 让产品自然入镜'];
function select(id:string){void router.replace({query:{...route.query,session:id}});}
function create(){const reference=studio.value.references.find(r=>r.id===route.query.reference);const product=studio.value.products.find(p=>p.id===route.query.product);const session={id:uid(),projectId:props.projectId,title:reference?`复刻 · ${reference.title}`:'新的创作会话',stage:0,brief:'',direction:'',script:'',version:1,messages:[],updatedAt:now(),reference,productIds:product?[product.id]:[]};studio.value.sessions.unshift(session);select(session.id);}
function latestSession(){return studio.value.sessions.filter(s=>s.projectId===props.projectId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];}
function ensureSession(){
  const requested=typeof route.query.session==='string'?route.query.session:'';
  if(requested&&studio.value.sessions.some(s=>s.id===requested&&s.projectId===props.projectId))return;
  const latest=latestSession();
  if(latest){select(latest.id);return;}
  create();
}
watch(()=>[props.projectId,route.query.session],ensureSession,{immediate:true});
function deleteSession(id:string){
  studio.value.sessions=studio.value.sessions.filter(session=>session.id!==id);
  deleting.value='';
  if(route.query.session!==id)return;
  const next=latestSession();
  if(next)select(next.id);else create();
}
watch(()=>current.value?.id,()=>{input.value='';seconds.value=current.value?.duration??'15';ratio.value=current.value?.ratio??'9:16';outputType.value=current.value?.outputType??'视频';},{immediate:true});
watch([seconds,ratio,outputType],()=>{const s=current.value;if(s){s.duration=seconds.value;s.ratio=ratio.value;s.outputType=outputType.value;s.updatedAt=now();}});
function chat(){const s=current.value;if(!s||!input.value.trim())return;const firstMessage=!s.messages.some(message=>message.role==='user');const text=input.value.trim();s.messages.push({role:'user',text});if(s.stage>1){s.stage=1;s.direction='';s.script='';s.version++;s.messages.push({role:'assistant',text:'需求已更新，原有成片保留为历史版本。请重新选择创意方向，确认新的脚本后再生成。'});}else{s.stage=1;s.messages.push({role:'assistant',text:'收到。我已整理你的需求，请从下方选择一个创意方向，也可以继续告诉我调整意见。'});}s.brief += `${s.brief?'\n':''}${text}`;s.title=s.title==='新的创作会话'?text.slice(0,24):s.title;s.updatedAt=now();input.value='';if(firstMessage)historyCollapsed.value=false;}
function choose(direction:string){const s=current.value;if(!s)return;s.direction=direction;s.stage=2;s.script=`【开场 0–3 秒】\n${direction.split(' · ')[0]}，以产品特写引出需求。\n\n【展开 3–10 秒】\n结合「${s.brief.slice(0,80)}」展现使用场景与核心卖点。\n\n【收尾 10–15 秒】\n展示使用结果与品牌画面，以自然的行动邀请结束。`;s.messages.push({role:'assistant',text:`已选择「${direction}」。下方脚本与分镜可以直接编辑，确认后进入生成设置。`});s.updatedAt=now();}
function scriptChanged(){const s=current.value;if(s&&s.stage>2){s.stage=2;s.version++;}}
function generate(){const s=current.value;if(!s)return;if(!s.script.trim()){toast.error('请先填写脚本');return;}if(studio.value.projects.find(p=>p.id===props.projectId)?.archived){toast.error('归档项目不能生成');return;}if(studio.value.jobs.some(j=>j.sessionId===s.id&&['生成中','等待中'].includes(j.status))){toast.info('当前会话正在生成');return;}startGeneration({projectId:props.projectId,sessionId:s.id,title:s.script,type:outputType.value,source:'专家创作',duration:seconds.value,ratio:ratio.value,quality:'1080P',brief:s.script,reference:s.reference,productIds:[...s.productIds],version:s.version,mediaIds:[],inPublishing:false,attributes:{...blankAttributes(),theme:s.title,hook:s.direction.split(' · ')[0]!,product:studio.value.products.find(p=>p.id===s.productIds[0])?.name??'未分类'}},fail.value);s.stage=4;s.messages.push({role:'assistant',text:'生成任务已提交。进度与结果显示在下方，离开页面后也会保留。'});s.updatedAt=now();}
</script>
<template>
  <div class="flex min-h-[560px] overflow-hidden bg-white">
    <main class="relative flex min-w-0 flex-1 flex-col">
      <template v-if="current">
        <div v-if="hasStarted" class="min-h-48 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div v-for="(m, i) in conversationMessages" :key="i" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
            <div class="max-w-[90%] whitespace-pre-wrap text-[13px] leading-6" :class="m.role === 'user' ? 'rounded-2xl rounded-br-md bg-sky-500 px-4 py-3 text-white' : 'py-1 text-slate-600'">{{ m.text }}</div>
          </div>
        </div>
        <div v-else class="flex-1" />

        <div class="mx-auto w-full max-w-[1200px] space-y-4 px-6 pb-5">
          <div v-if="current.stage === 1" class="space-y-1">
            <p class="mb-2 text-xs font-medium text-slate-500">选择一个创意方向</p>
            <button v-for="d in directions" :key="d" class="block w-full rounded-lg px-3 py-2.5 text-left text-xs text-sky-700 hover:bg-sky-50" @click="choose(d)">{{ d }} <span class="text-slate-400">→</span></button>
          </div>
          <div v-if="current.stage >= 2" class="space-y-3 rounded-xl bg-slate-50 p-4">
            <div class="flex items-center justify-between text-xs"><span class="font-semibold text-slate-800">脚本与分镜 · {{ current.direction }}</span><span class="text-slate-400">{{ current.stage === 2 ? '待确认' : '已确认' }}</span></div>
            <textarea v-model="current.script" aria-label="脚本与分镜" class="h-44 w-full resize-y rounded-lg bg-white p-3 text-xs leading-6 text-slate-700 outline-none focus:ring-1 focus:ring-sky-300" @input="scriptChanged" />
            <button v-if="current.stage === 2" class="studio-primary" @click="current.stage = 3">确认脚本，进入生成</button>
            <div v-else class="space-y-3">
              <div class="grid grid-cols-3 gap-3">
                <label><span class="studio-label">类型</span><select v-model="outputType" class="studio-field"><option>视频</option><option>图文</option></select></label>
                <label><span class="studio-label">画幅</span><select v-model="ratio" class="studio-field"><option>9:16</option><option>16:9</option><option>1:1</option></select></label>
                <label><span class="studio-label">时长</span><select v-model="seconds" class="studio-field"><option value="15">15 秒</option><option value="30">30 秒</option><option value="60">60 秒</option></select></label>
              </div>
              <label class="block text-[11px] text-slate-400"><input v-model="fail" type="checkbox"> 模拟生成失败（可重试）</label>
              <div class="flex flex-wrap items-center gap-3"><button class="studio-primary" @click="generate">{{ current.stage === 4 ? '再次生成' : '确认并生成' }} · 预计 20 积分</button><button class="text-xs text-slate-400" @click="current.stage = 2">返回修改脚本</button></div>
              <p class="text-[10px] text-slate-400">原型不实际扣费，生成结果为可预览的创作方案。</p>
            </div>
          </div>
          <section class="pt-3">
            <header class="mb-5 text-center">
              <h1 class="mb-2 text-2xl font-semibold brand-text">解锁专业创意，打造高质量营销视频</h1>
              <p class="mx-auto max-w-3xl text-sm leading-6 text-slate-400">提供产品资料，AI 帮你提炼核心卖点、构思创意脚本，结合专业参数配置，打造符合需求的视频内容</p>
            </header>
            <form class="w-full rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" @submit.prevent="chat">
              <textarea v-model="input" aria-label="专家对话" class="h-36 max-h-56 min-h-36 w-full resize-y border-0 bg-transparent p-2 text-sm leading-7 outline-none placeholder:text-slate-400 focus:ring-0 sm:h-40 sm:min-h-40 sm:p-3" placeholder="描述你的产品资料、目标受众或视频创意…" @keydown.ctrl.enter="chat" />
              <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span class="text-xs font-medium text-slate-400">Agent · 专家创作</span>
                <button class="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label="发送消息" :disabled="!input.trim()"><Send class="h-4 w-4" /></button>
              </div>
              <p class="mt-2 text-right text-xs text-slate-400">聊天不消耗积分</p>
            </form>
          </section>
        </div>
      </template>
      <div v-else class="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <MessageSquare class="mb-4 h-9 w-9 text-sky-300" />
        <h3 class="text-base font-semibold text-slate-700">好创意，从对话开始</h3>
        <p class="my-3 text-sm text-slate-400">需求澄清 · 创意选择 · 脚本确认 · 生成成片</p>
        <button class="studio-primary" @click="create"><Plus class="h-4 w-4" />新建会话</button>
      </div>
    </main>

    <aside class="shrink-0 overflow-hidden border-l border-slate-100 transition-[width] duration-200" :class="historyCollapsed ? 'w-12' : 'w-60 xl:w-64'" aria-label="历史会话侧边栏">
      <div class="flex h-full flex-col p-2">
        <div class="flex shrink-0 flex-col items-center gap-2">
          <button class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-600" :aria-label="historyCollapsed ? '展开历史会话' : '收起历史会话'" :title="historyCollapsed ? '展开历史会话' : '收起历史会话'" @click="historyCollapsed = !historyCollapsed">
            <PanelLeftOpen v-if="historyCollapsed" class="h-4 w-4" /><PanelLeftClose v-else class="h-4 w-4" />
          </button>
          <button class="flex h-7 items-center justify-center gap-1 rounded-lg text-sky-600 hover:bg-sky-50" :class="historyCollapsed ? 'w-7 shrink-0' : 'w-full'" :aria-label="historyCollapsed ? '新建会话' : undefined" :title="historyCollapsed ? '新建会话' : undefined" @click="create"><Plus class="h-4 w-4" /><span v-if="!historyCollapsed" class="text-xs font-medium">新建会话</span></button>
        </div>
        <template v-if="!historyCollapsed">
          <input v-model="search" class="my-3 h-9 w-full rounded-lg bg-slate-50 px-3 text-xs outline-none focus:ring-1 focus:ring-sky-300" placeholder="搜索历史会话" aria-label="搜索历史会话">
          <div class="mb-2 px-2 text-[11px] text-slate-400">历史会话 · 当前项目</div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-for="s in sessions" :key="s.id" class="group mb-1 rounded-lg px-2 py-2" :class="s.id === current?.id ? 'bg-sky-50' : 'hover:bg-slate-50'">
              <button class="w-full truncate text-left text-xs text-slate-700" @click="select(s.id)">{{ s.title }}</button>
              <div class="mt-2 flex items-center gap-2 text-[10px] text-slate-400"><span class="flex-1">{{ new Date(s.updatedAt).toLocaleDateString() }}</span><button aria-label="重命名会话" title="重命名" @click="renameId = s.id; editTitle = s.title"><Pencil class="h-3 w-3" /></button><button aria-label="删除会话" title="删除" @click="deleting = s.id"><Trash2 class="h-3 w-3" /></button></div>
              <div v-if="renameId === s.id" class="mt-2"><input v-model="editTitle" class="h-8 w-full rounded-md bg-white px-2 text-xs outline-none ring-1 ring-slate-200" @keydown.enter="s.title = editTitle.trim() || s.title; renameId = ''"><button class="mt-2 text-xs text-sky-600" @click="s.title = editTitle.trim() || s.title; renameId = ''">保存名称</button></div>
              <div v-if="deleting === s.id" class="mt-2 text-xs"><p class="mb-2 text-rose-500">删除此会话？成片仍保留。</p><button class="mr-3 text-rose-500" @click="deleteSession(s.id)">删除</button><button @click="deleting = ''">取消</button></div>
            </div>
            <p v-if="!sessions.length" class="px-2 py-8 text-center text-xs text-slate-400">暂无历史会话</p>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>
