# overseas-studio-new

出海动力前端演示项目，当前开发版本位于 `vue/`，使用 Vue 3、TypeScript 和 Vite。数据与业务操作均为前端演示，无需后端。

## 本地运行

需要 Node.js 22.12 或更新版本。

```sh
cd vue
npm ci
cp .env.example .env
```

在 `vue/.env` 中设置 `password=你的访问密码`，然后执行：

```sh
npm run dev
```

默认地址为 `http://127.0.0.1:5173`。`.env`、依赖目录和构建产物不提交到仓库。

## 目录

| 路径 | 用途 |
| --- | --- |
| `vue/` | 当前 Vue 演示工程、测试及设计说明 |
| `源码/` | 原 React 工程，用于迁移对照 |
| `网页版/` | 原版静态演示 |
| `reference/` | 同事提供的数据分析参考设计 |

## 项目说明

- [Vue 工程运行与验证](vue/README.md)
- [产品需求](vue/prd.md)
- [数据分析改造原因与指标获取边界](vue/docs/analytics-design-rationale.md)
- [验收记录](vue/docs/verification.md)

