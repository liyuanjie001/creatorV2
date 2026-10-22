<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use, type EChartsCoreOption } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
use([SVGRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);
interface Series {
  name: string;
  color: string;
  type: 'area' | 'line' | 'bar';
}
const props = defineProps<{
  type: 'area' | 'line' | 'bar' | 'pie';
  data: object[];
  series: Series[];
  colors?: string[];
  legend?: boolean;
}>();
function value(row: object, key: string): string | number {
  const cell: unknown = Reflect.get(row, key);
  return typeof cell === 'string' || typeof cell === 'number' ? cell : '';
}
const option = computed<EChartsCoreOption>(() => {
  const common = {
    animation: false,
    textStyle: {
      fontFamily: 'Inter, PingFang SC, Microsoft YaHei, system-ui, sans-serif',
    },
    tooltip: {
      trigger: props.type === 'pie' ? 'item' : 'axis',
      backgroundColor: '#fff',
      borderColor: '#e2e9ee',
      textStyle: {
        color: '#64748b',
        fontSize: 12,
      },
      ...(props.type === 'pie'
        ? {
            formatter: '{b}<br />占比: {c}%',
          }
        : {}),
    },
    legend: props.legend
      ? {
          bottom: 0,
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
          textStyle: {
            color: '#64748b',
            fontSize: 12,
          },
        }
      : {
          show: false,
        },
  };
  if (props.type === 'pie')
    return {
      ...common,
      color: props.colors,
      series: [
        {
          type: 'pie',
          radius: ['44%', '66%'],
          center: ['50%', '46%'],
          padAngle: 3,
          itemStyle: {
            opacity: 0.85,
          },
          label: {
            show: false,
          },
          data: props.data.map((row) => ({
            name: value(row, 'name'),
            value: value(row, 'value'),
          })),
        },
      ],
    };
  return {
    ...common,
    grid: {
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
      top: 10,
      right: 10,
      bottom: props.legend ? 36 : 20,
      left: 32,
    },
    xAxis: {
      type: 'category',
      boundaryGap: props.type === 'bar',
      data: props.data.map((row) => value(row, 'day')),
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        hideOverlap: true,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(100,116,139,0.12)',
          type: 'dashed',
        },
      },
    },
    series: props.series.map((series) => ({
      name: series.name,
      type: series.type === 'bar' ? 'bar' : 'line',
      smooth: true,
      showSymbol: false,
      barMaxWidth: 24,
      itemStyle: {
        color: series.color,
        ...(series.type === 'bar'
          ? {
              borderRadius: [4, 4, 0, 0],
              opacity: 0.85,
            }
          : {}),
      },
      lineStyle: {
        width: 2,
      },
      ...(series.type === 'area'
        ? {
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: `${series.color}73`,
                  },
                  {
                    offset: 1,
                    color: `${series.color}00`,
                  },
                ],
              },
            },
          }
        : {}),
      data: props.data.map((row) => value(row, series.name)),
    })),
  };
});
</script>

<template>
  <VChart class="h-full w-full" :option="option" :init-options="{ renderer: 'svg' }" autoresize />
</template>
