# demo2 的迁移结构

原工程使用 React 19、TypeScript、Vite 7、Tailwind CSS 3、React Router、Radix 和 Recharts。业务数据集中在 mock 文件，未发现后端请求。AI 整理、分镜和生成使用定时器模拟，部分按钮只显示演示提示。

原项目详情页有 1,105 行，素材库有 574 行。组件同时负责布局、筛选、表单和生成状态，维护时需要阅读整页。工程还包含大量业务未使用的模板 UI。

迁移选择独立的 Vue 工程，并沿用 Tailwind CSS 3 和原主题变量，避免将框架迁移和视觉改版混在一起。图表改用 ECharts，保留类型、数据、配色、图例和提示，绘制细节由 ECharts 实现。

## 页面和入口

以下路径均位于 URL 的 `#` 后。

| 页面                         | 路径                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| 工作台                       | `/`                                                                    |
| 创意中心                     | `/inspiration`，查询参数 `tab=inspire/trends/notes`                    |
| 妙记                         | `/notes`                                                               |
| 自由创作                     | `/create`                                                              |
| 账号管理                     | `/accounts`                                                            |
| 数据分析                     | `/analytics`                                                           |
| 任务管理、新建任务           | `/tasks`、`/tasks/new`                                                 |
| 项目列表、新建项目、项目详情 | `/projects`、`/projects/new`、`/projects/:id`                          |
| 素材库                       | `/assets`                                                              |
| 设置                         | `/settings`，查询参数 `tab=notifications/security/appearance/api/team` |
| 回收站                       | `/trash`                                                               |
| 个人中心                     | `/me`                                                                  |

`/trends` 重定向到创意中心的热点标签。未知路径显示工作台。未知项目 ID 沿用原版行为，展示第一个示例项目。

## 状态由所属功能管理

`pages` 负责页面组合，`layout` 负责全局导航和顶栏。项目详情与素材库使用沉浸布局，由路由的 `meta.immersive` 指定。

`useProjectWorkspace` 管理当前项目、选中的商品、栏目、生成结果和批量进度。项目子面板通过有类型的 provide/inject 访问同一个工作区。生成结果保留在项目页会话中。路由按项目路径重新挂载，切换项目时清理状态和定时器。商品表单按商品 ID 重新挂载。

项目详情保留全部生成、项目简报、商品、灵感库、元素、Canvas、AI 聊天、AI 导演、账号管理、发布管理、数据归因、任务调度和回收站，共 13 个栏目。批量生成弹窗单独实现。

`useAssetLibrary` 管理素材导航、查询、过滤、视图和选中项。导航、工具栏、内容、卡片和表格分别实现为组件。收藏按钮保留原版的卡片内演示状态，不新增全局持久化。

`useIdeaNotes` 管理共享妙记。它读取并校验旧存储格式，新增和删除后写回同一个键。损坏数据回退到示例数据，存储不可用时继续支持当前会话操作。只有相同来源的页面才能共享 localStorage，旧网页与新工程使用不同端口时不会自动搬运存储。

`useInspirationDialog` 管理灵感弹窗，替代全局 DOM 自定义事件。`useDemoTimers` 在所属组件卸载时取消尚未完成的演示操作。

全局路由守卫将未验证的访问转到 `/unlock`。密码由 Vite 从 `.env` 的 `password` 读取，构建时仅注入 SHA-256 摘要。验证成功后保存同一摘要作为本地访问标记。构建时修改密码会使旧标记失效；前端校验不保护静态资源或后端接口。

## 依赖与接口变化

| 原实现                | Vue 实现                                           |
| --------------------- | -------------------------------------------------- |
| React 和 React Router | Vue 3、Vue Router 4，路由懒加载                    |
| TSX 组件              | `<script setup lang="ts">` 和 Vue 模板             |
| React Radix           | Reka UI 的弹窗、菜单和开关，沿用原样式             |
| Sonner                | `vue-sonner`                                       |
| Recharts              | `vue-echarts` 和 ECharts SVG 渲染器                |
| Lucide React          | 相同版本图标的 `lucide-vue-next`                   |
| React 回调属性        | Vue props、emits 和 slots                          |
| 混合数据与类型        | `types/domain.ts`、mock 数据和存储 composable 分离 |

Vue 工程没有新增 HTTP API、后端、认证或社媒接口。创作组件通过 `start`、`done` 事件向所属页面报告进度和草稿，页面决定如何展示生成结果。
