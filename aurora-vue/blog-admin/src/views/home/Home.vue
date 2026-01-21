<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="12" :md="6">
        <el-card class="stat-card" v-loading="loading">
          <div class="stat-icon" :style="{ color: card.color }">
            {{ card.icon }}
          </div>
          <div class="stat-meta">
            <span class="stat-label">{{ card.label }}</span>
            <span class="stat-value">{{ card.value }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="panel-card" v-loading="loading">
      <div class="panel-title">一周访问量</div>
      <div class="panel-chart">
        <VChart :option="viewCountOption" autoresize />
      </div>
    </el-card>

    <el-card class="panel-card" v-loading="loading">
      <div class="panel-title">文章贡献统计</div>
      <div class="panel-chart contribution-chart">
        <VChart :option="articleContributionOption" autoresize />
      </div>
    </el-card>

    <el-row :gutter="20" class="panel-row">
      <el-col :xs="24" :md="16">
        <el-card class="panel-card" v-loading="loading">
          <div class="panel-title">文章浏览量排行</div>
          <div class="panel-chart">
            <VChart :option="articleRankOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card class="panel-card" v-loading="loading">
          <div class="panel-title">文章分类统计</div>
          <div class="panel-chart">
            <VChart :option="categoryOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import type { EChartsOption } from 'echarts'
import dayjs from 'dayjs'

defineOptions({
  name: 'HomeDashboard',
})

interface UniqueViewDTO {
  day: string
  viewsCount: number
}

interface CategoryDTO {
  categoryName: string
  articleCount: number
}

interface ArticleRankDTO {
  articleTitle: string
  viewsCount: number
}

interface ArticleStatisticsDTO {
  date: string
  count: number
}

interface DashboardData {
  viewsCount: number
  messageCount: number
  userCount: number
  articleCount: number
  uniqueViewDTOs?: UniqueViewDTO[]
  categoryDTOs?: CategoryDTO[]
  articleRankDTOs?: ArticleRankDTO[]
  articleStatisticsDTOs?: ArticleStatisticsDTO[]
}

interface DashboardResponse {
  data: DashboardData
}

type LineChartOption = EChartsOption & {
  xAxis: {
    type?: string
    data: string[]
    axisLine?: { lineStyle?: { color?: string } }
  }
  yAxis: {
    type?: string
    axisLine?: { lineStyle?: { color?: string } }
  }
  series: Array<{
    name?: string
    type?: string
    data: number[]
    smooth?: boolean
    areaStyle?: Record<string, unknown>
  }>
}

type BarChartOption = EChartsOption & {
  xAxis: { type?: string; data: string[] }
  yAxis: { type?: string }
  series: Array<{
    name?: string
    type?: string
    data: number[]
    itemStyle?: { color?: string }
  }>
}

type PieChartOption = EChartsOption & {
  legend?: { bottom?: number | string; data?: string[] }
  series: Array<{
    name?: string
    type?: string
    roseType?: string
    data: Array<{ name: string; value: number }>
  }>
}

const loading = ref(true)
const stats = reactive({
  viewsCount: 0,
  messageCount: 0,
  userCount: 0,
  articleCount: 0,
})

const statCards = computed(() => [
  { label: '访问量', value: stats.viewsCount, color: '#2f9f97', icon: '👀' },
  { label: '用户量', value: stats.userCount, color: '#33a37f', icon: '👥' },
  { label: '文章量', value: stats.articleCount, color: '#f0616b', icon: '📝' },
  { label: '留言量', value: stats.messageCount, color: '#3b9ad9', icon: '💬' },
])

const viewCountOption = ref<LineChartOption>({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '3%', bottom: '3%', top: '12%', containLabel: true },
  xAxis: { type: 'category', data: [], axisLine: { lineStyle: { color: '#6b7280' } } },
  yAxis: { type: 'value', axisLine: { lineStyle: { color: '#9ca3af' } } },
  series: [{ name: '访问量', type: 'line', data: [], smooth: true, areaStyle: {} }],
})

const articleRankOption = ref<BarChartOption>({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '3%', bottom: '3%', top: '12%', containLabel: true },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [{ name: '浏览量', type: 'bar', data: [], itemStyle: { color: '#58afff' } }],
})

const categoryOption = ref<PieChartOption>({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      name: '文章分类',
      type: 'pie',
      roseType: 'radius',
      data: [],
    },
  ],
})

const articleContributionOption = ref<EChartsOption>({
  tooltip: {
    position: 'top',
    formatter: (params: { data: [string, number] }) => {
      const [date, count] = params.data
      return `${date}<br/>发布文章: ${count} 篇`
    },
  },
  visualMap: {
    min: 0,
    max: 5,
    type: 'piecewise',
    orient: 'horizontal',
    left: 'center',
    bottom: 10,
    pieces: [
      { min: 0, max: 0, label: '无', color: '#d8e2dc' },
      { min: 1, max: 1, label: '1篇', color: '#c6e48b' },
      { min: 2, max: 2, label: '2篇', color: '#7bc96f' },
      { min: 3, max: 3, label: '3篇', color: '#239a3b' },
      { min: 4, label: '4篇+', color: '#196127' },
    ],
    textStyle: {
      fontSize: 11,
    },
  },
  calendar: {
    top: 50,
    left: 60,
    right: 30,
    bottom: 50,
    cellSize: [13, 13],
    range: [dayjs().subtract(1, 'year').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    itemStyle: {
      borderWidth: 2,
      borderColor: '#fff',
      borderRadius: 2,
    },
    splitLine: {
      show: false,
    },
    yearLabel: {
      show: true,
      position: 'top',
      margin: 20,
      color: '#6b7280',
      fontSize: 14,
      fontWeight: 600,
    },
    dayLabel: {
      show: true,
      firstDay: 0,
      nameMap: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      margin: 10,
      color: '#6b7280',
      fontSize: 11,
    },
    monthLabel: {
      show: true,
      nameMap: 'cn',
      margin: 8,
      color: '#6b7280',
      fontSize: 11,
    },
  },
  series: [
    {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: [],
    },
  ],
})

const applyChartData = (data: DashboardData) => {
  const viewDays = data.uniqueViewDTOs?.map((item) => item.day) ?? []
  const viewValues = data.uniqueViewDTOs?.map((item) => item.viewsCount) ?? []
  viewCountOption.value.xAxis.data = viewDays
  const viewSeries = viewCountOption.value.series[0]
  if (viewSeries) {
    viewSeries.data = viewValues
  }

  const rankLabels = data.articleRankDTOs?.map((item) => item.articleTitle) ?? []
  const rankValues = data.articleRankDTOs?.map((item) => item.viewsCount) ?? []
  articleRankOption.value.xAxis.data = rankLabels
  const rankSeries = articleRankOption.value.series[0]
  if (rankSeries) {
    rankSeries.data = rankValues
  }

  const categoryData =
    data.categoryDTOs?.map((item) => ({
      name: item.categoryName,
      value: item.articleCount,
    })) ?? []
  const pieSeries = categoryOption.value.series[0]
  if (pieSeries) {
    pieSeries.data = categoryData
  }
  if (categoryOption.value.legend) {
    categoryOption.value.legend.data = categoryData.map((item) => item.name)
  }

  // 处理文章贡献统计数据
  // 生成完整一年的日期，包括没有数据的日期（值为0）
  const startDate = dayjs().subtract(1, 'year')
  const endDate = dayjs()
  const dateMap = new Map<string, number>()

  // 填充后端返回的数据
  data.articleStatisticsDTOs?.forEach((item) => {
    dateMap.set(item.date, item.count)
  })

  // 生成完整的365天数据
  const contributionData: [string, number][] = []
  let currentDate = startDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const dateStr = currentDate.format('YYYY-MM-DD')
    contributionData.push([dateStr, dateMap.get(dateStr) || 0])
    currentDate = currentDate.add(1, 'day')
  }

  const seriesArray = articleContributionOption.value.series as Array<{
    type?: string
    coordinateSystem?: string
    data?: [string, number][]
  }>
  if (seriesArray?.[0]) {
    seriesArray[0].data = contributionData
  }
}

const fetchDashboard = async () => {
  try {
    const { data } = await axios.get<DashboardResponse>('/api/admin')
    Object.assign(stats, {
      viewsCount: data.data.viewsCount,
      messageCount: data.data.messageCount,
      userCount: data.data.userCount,
      articleCount: data.data.articleCount,
    })
    applyChartData(data.data)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.5rem;
}

.stats-row {
  margin-bottom: 0.5rem;
}

.stat-card {
  border-radius: 18px;
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  box-shadow: var(--shadow-card);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border-soft);
  box-shadow: var(--ring);
}

.stat-meta {
  display: grid;
  gap: 0.4rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ink-500);
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 1.4rem;
  color: var(--ink-900);
  font-weight: 600;
}

.panel-card {
  border-radius: 20px;
  border: 1px solid var(--border-soft);
  background: var(--surface-1);
  box-shadow: var(--shadow-card);
}

.panel-title {
  font-size: 0.95rem;
  color: var(--ink-700);
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.panel-chart {
  height: 320px;
}

.contribution-chart {
  height: 220px;
}

.panel-row {
  margin-top: 0.2rem;
}

@media (max-width: 768px) {
  .panel-chart {
    height: 260px;
  }

  .contribution-chart {
    height: 200px;
  }
}
</style>
