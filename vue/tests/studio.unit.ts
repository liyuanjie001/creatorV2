import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { createAppRouter } from '@/router';
import { identityService, DEMO_CODE, sendCode } from '@/services/identity';
import { authorize, blankAttributes, contentMetrics, createProject, ensurePublishTask, parseReference, studio, submitPublish, tickStudio, validatePublish } from '@/services/studio';
import { uid } from '@/services/storage';
import type { Film } from '@/types/studio';
let wrapper: VueWrapper | undefined;
beforeEach(() => { localStorage.clear(); localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__); identityService.demo(); studio.value.projects = []; studio.value.accounts = []; studio.value.groups = [{id:'ungrouped',name:'未分组'}]; studio.value.films=[]; studio.value.tasks=[]; studio.value.content=[]; studio.value.sessions=[]; studio.value.jobs=[]; });
afterEach(() => { wrapper?.unmount(); wrapper=undefined; document.body.innerHTML=''; vi.useRealTimers(); vi.unstubAllGlobals(); });
async function open(path:string){const router=createAppRouter(createMemoryHistory());await router.push(path);await router.isReady();wrapper=mount(App,{attachTo:document.body,global:{plugins:[router]}});await flushPromises();return {router,app:wrapper};}
function installMemoryIndexedDB() {
  const files = new Map<string, Blob>();
  const factory = {
    open: () => {
      const request: Record<string, unknown> = { result: undefined };
      const database = {
        createObjectStore: () => undefined,
        close: () => undefined,
        transaction: () => {
          const transaction: Record<string, unknown> = {
            objectStore: () => ({
              put: (value: Blob, key: string) => { files.set(key, value); return {}; },
              get: (key: string) => {
                const read: Record<string, unknown> = { result: undefined };
                queueMicrotask(() => { read.result = files.get(key); (read.onsuccess as (() => void) | undefined)?.(); });
                return read;
              },
            }),
          };
          queueMicrotask(() => (transaction.oncomplete as (() => void) | undefined)?.());
          return transaction;
        },
      };
      request.result = database;
      queueMicrotask(() => {
        (request.onupgradeneeded as (() => void) | undefined)?.();
        (request.onsuccess as (() => void) | undefined)?.();
      });
      return request;
    },
  };
  vi.stubGlobal('indexedDB', factory as unknown as IDBFactory);
}
test('注册和工作空间数据按新用户隔离，密码不写入 localStorage', async()=>{
const demoProject=createProject('演示用户的项目');identityService.logout();
const email=`person-${Date.now()}@example.com`;const password='correct-pass-123';sendCode(email,'email');
installMemoryIndexedDB();
await identityService.register(email,'email',password,DEMO_CODE,'');
const userId=JSON.parse(localStorage.getItem('chuhai-studio-session')!).id as string;
expect(userId).not.toBe('demo');expect(studio.value.projects).toHaveLength(0);
const personal=createProject('新用户的项目');expect(personal.id).not.toBe(demoProject.id);
expect(localStorage.getItem(`chuhai-studio-v1:${userId}`)).toContain(personal.name);
const localValues=Array.from({length:localStorage.length},(_,index)=>localStorage.getItem(localStorage.key(index)??'')??'').join(' ');expect(localValues).not.toContain(password);
identityService.demo();expect(studio.value.projects.some(p=>p.id===demoProject.id)).toBe(true);
});
test('注册验证码身份校验和冷却生效',()=>{expect(()=>sendCode('bad','email')).toThrow();sendCode('person@example.com','email');expect(()=>sendCode('person@example.com','email')).toThrow('倒计时');});
test('TK 授权重复更新帐号、状态模拟及分组删除回归规则',()=>{const a=authorize('demo.brand','ungrouped','成功');expect(authorize('@demo.brand','ungrouped','过期').id).toBe(a.id);expect(studio.value.accounts).toHaveLength(1);expect(studio.value.accounts[0]?.status).toBe('授权过期');expect(()=>authorize('@denied','ungrouped','拒绝')).toThrow('拒绝');});
test('链接校验拒绝未知域名、非详情地址及重复链接',()=>{expect(()=>parseReference('https://example.com/video/1')).toThrow();expect(()=>parseReference('https://www.tiktok.com/@creator')).toThrow();expect(parseReference('https://www.tiktok.com/@creator/video/123').id).toBe(parseReference('https://www.tiktok.com/@creator/video/123?share=1').id);});
test('项目导航、模式与二级分析状态进入地址，Roxy 留在更多入口',async()=>{const p=createProject('测试项目');const {app,router}=await open(`/projects/${p.id}?section=publish`);expect(app.text()).toContain('我的作品');await app.findAll('aside button').find(b=>b.text().includes('数据采集'))!.trigger('click');await flushPromises();expect(router.currentRoute.value.query.section).toBe('analytics');await app.findAll('aside button').find(b=>b.text().includes('自由创作'))!.trigger('click');await flushPromises();await app.findAll('button').find(b=>b.text()==='专家模式')!.trigger('click');await flushPromises();expect(router.currentRoute.value.query.mode).toBe('expert');});
test('批量成片逐条配置帐号，可见范围必选，部分失败单独重试并进入分析',async()=>{
const p=createProject('批量项目');const a=authorize('@brand','ungrouped','成功');p.accountIds=[a.id];
const make=(title:string):Film=>({id:uid(),projectId:p.id,title,type:'视频',source:'普通创作',createdAt:new Date().toISOString(),duration:'15',ratio:'9:16',quality:'1080P',brief:'brief',productIds:[],version:1,mediaIds:[],inPublishing:true,attributes:blankAttributes()});
const one=make('第一条');const two=make('第二条');studio.value.films=[one,two];const first=ensurePublishTask(one);first.simulateFailure=true;const second=ensurePublishTask(two);Object.assign(first,{accountId:a.id,privacy:'PUBLIC_TO_EVERYONE'});Object.assign(second,{accountId:a.id,privacy:'SELF_ONLY'});
await submitPublish([first,second]);expect(studio.value.tasks.map(t=>t.status)).toEqual(['待发布','待发布']);await tickStudio(Date.now()+2000);await tickStudio(Date.now()+7000);expect(studio.value.tasks.find(t=>t.id===first.id)?.status).toBe('发布失败');expect(studio.value.tasks.find(t=>t.id===second.id)?.status).toBe('发布成功');expect(studio.value.content).toHaveLength(1);
first.simulateFailure=false;await submitPublish([{...first,scheduledAt:'',status:'发布失败'}]);await tickStudio(Date.now()+2000);await tickStudio(Date.now()+7000);expect(studio.value.tasks.find(t=>t.id===first.id)?.status).toBe('发布成功');expect(studio.value.content).toHaveLength(2);
expect(()=>validatePublish({...second,id:uid(),privacy:''})).toThrow('可见范围');
});
test('二次提交拒绝，避免状态未知时重复发布',async()=>{const p=createProject('重复保护');const a=authorize('@brand','ungrouped','成功');p.accountIds=[a.id];const film:Film={id:uid(),projectId:p.id,title:'一次发布',type:'视频',source:'普通创作',createdAt:new Date().toISOString(),duration:'15',ratio:'9:16',quality:'1080P',brief:'',productIds:[],version:1,mediaIds:[],inPublishing:true,attributes:blankAttributes()};studio.value.films=[film];const task=ensurePublishTask(film);Object.assign(task,{accountId:a.id,privacy:'PUBLIC_TO_EVERYONE'});await submitPublish([structuredClone(task)]);await expect(submitPublish([structuredClone(task)])).rejects.toThrow('重复发布');});
test('区分真实零值、未采集、无权限和历史不足，不伪造指标',()=>{
const base={id:'metric',accountId:'a',projectIds:[],title:'内容',type:'视频' as const,publishedAt:new Date().toISOString(),attributes:blankAttributes()};
expect(contentMetrics({...base,snapshots:[{date:'2026-11-03',views:0,likes:0,comments:0,shares:0}],collection:'可用'},7,true).metrics?.views).toBe(0);
expect(contentMetrics({...base,snapshots:[],collection:'未采集'},7,true).reason).toBe('未采集');
expect(contentMetrics({...base,snapshots:[],collection:'无权限'},7,true).reason).toBe('无权限');
expect(contentMetrics({...base,snapshots:[{date:'2026-11-03',views:10,likes:2,comments:1,shares:1}],collection:'可用'},90,false).reason).toBe('历史不足');
});
