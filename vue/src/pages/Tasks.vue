<script setup lang="ts">
import { Plus, CheckCircle2, Loader2, CircleDashed, XCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { tasks, type TaskStatus } from '@/data/mock';
import { cn } from '@/lib/utils';
import TaskCard from '@/components/TaskCard.vue';
import { useRouter } from 'vue-router';
const columns: {
  status: TaskStatus;
  icon: typeof Loader2;
  tone: string;
}[] = [
  {
    status: '待发布',
    icon: CircleDashed,
    tone: 'text-sky-600',
  },
  {
    status: '发布中',
    icon: Loader2,
    tone: 'text-sky-600',
  },
  {
    status: '已完成',
    icon: CheckCircle2,
    tone: 'text-emerald-600',
  },
  {
    status: '已失败',
    icon: XCircle,
    tone: 'text-rose-600',
  },
];
const router = useRouter();
const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="任务管理" desc="内容分发流水线：创建任务 → 多平台排期 → 自动发布 → 数据回流">
      <template #extra>
        <Button
          size="sm"
          class="gap-2 brand-gradient text-white hover:opacity-90"
          @click="router.push('/tasks/new')"
        >
          <Plus class="h-4 w-4"></Plus>
          新建任务
        </Button>
      </template>
    </PageHeader>
    <div class="grid grid-cols-4 gap-4">
      <template :key="status" v-for="{ status, icon: Icon, tone } in columns">
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
            <component :is="Icon" :class="cn('h-4 w-4', tone)"></component>
            <span class="text-[13px] font-medium text-slate-900">{{ status }}</span>
            <Badge variant="outline" class="border-slate-200 bg-slate-100 text-[11px] text-slate-500">
              {{ count(status) }}
            </Badge>
          </div>
          <div class="space-y-3">
            <template :key="t.id" v-for="t in tasks.filter((t) => t.status === status)">
              <TaskCard :task="t"></TaskCard>
            </template>
            <template v-if="count(status) === 0">
              <div
                class="rounded-xl border border-dashed border-slate-200 py-8 text-center text-[12px] text-slate-300"
              >
                暂无任务
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
