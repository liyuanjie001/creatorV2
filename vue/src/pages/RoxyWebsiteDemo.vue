<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  Play,
  Sparkles,
  UsersRound,
  Video,
  X,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const mobileMenuOpen = ref(false);
const navItems = [
  { label: '应用场景' },
  { label: '产品功能' },
  { label: '资源' },
  { label: '跨境营销解决方案' },
  { label: '价格方案' },
  { label: '下载' },
];
</script>

<template>
  <main class="roxy-website text-slate-900">
    <section class="roxy-website-hero" id="top">
      <header class="roxy-site-header">
        <RouterLink to="/" class="roxy-site-brand" aria-label="返回 Roxy 平台">
          <img src="/favicon.svg" alt="" />
          <span>Roxy浏览器</span>
        </RouterLink>
        <nav class="roxy-site-nav" aria-label="官网导航">
          <a v-for="item in navItems" :key="item.label" href="#top">
            <span v-if="item.label === '跨境营销解决方案'" class="roxy-tiktok-mark">♪</span>
            {{ item.label }}
            <ChevronDown
              v-if="['应用场景', '产品功能', '资源', '跨境营销解决方案'].includes(item.label)"
              class="size-3"
            />
          </a>
        </nav>
        <div class="roxy-site-actions">
          <button type="button" class="roxy-language">
            <Globe2 class="size-3.5" />
            ZH
          </button>
          <RouterLink to="/auth" class="roxy-login">登录</RouterLink>
          <RouterLink to="/auth?mode=register" class="roxy-register">注册</RouterLink>
        </div>
        <button
          type="button"
          class="roxy-mobile-menu"
          :aria-label="mobileMenuOpen ? '关闭菜单' : '打开菜单'"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <X v-if="mobileMenuOpen" class="size-5" />
          <Menu v-else class="size-5" />
        </button>
        <nav v-if="mobileMenuOpen" class="roxy-mobile-nav" aria-label="移动端官网导航">
          <a v-for="item in navItems" :key="item.label" href="#top" @click="mobileMenuOpen = false">
            {{ item.label }}
          </a>
          <RouterLink to="/auth" @click="mobileMenuOpen = false">登录</RouterLink>
          <RouterLink to="/auth?mode=register" @click="mobileMenuOpen = false">注册</RouterLink>
        </nav>
      </header>

      <div class="roxy-hero-copy">
        <span class="roxy-hero-eyebrow">
          <Sparkles class="size-3.5" />
          AI CONTENT GROWTH · GLOBAL CREATOR NETWORK
        </span>
        <h1>
          内容生产与
          <br class="sm:hidden" />
          矩阵分发
        </h1>
        <p>AI 驱动内容创作与矩阵分发，联动全球账号与达人，让世界看见你的品牌。</p>
        <div class="roxy-hero-buttons">
          <a href="#resources" class="roxy-resource-button">
            <Globe2 class="size-4" />
            查看全球资源
            <ArrowRight class="size-4" />
          </a>
          <RouterLink to="/auth?mode=register" class="roxy-trial-button">
            <Sparkles class="size-4" />
            免费试用
            <ArrowUpRight class="size-4" />
          </RouterLink>
        </div>
      </div>

      <div class="roxy-hero-stats" aria-label="平台数据">
        <article class="roxy-stat-card">
          <span class="roxy-stat-icon"><Globe2 class="size-5" /></span>
          <div>
            <strong>
              1800
              <span>万+</span>
            </strong>
            <p>多语内容版本</p>
          </div>
        </article>
        <article class="roxy-stat-card">
          <span class="roxy-stat-icon"><UsersRound class="size-5" /></span>
          <div>
            <strong>
              300
              <span>+</span>
            </strong>
            <p>内容制作形式</p>
          </div>
        </article>
        <article class="roxy-stat-card roxy-stat-wide">
          <span class="roxy-stat-icon"><Video class="size-5" /></span>
          <div>
            <strong>
              70
              <span>%</span>
            </strong>
            <p>内容生产成本降低</p>
          </div>
        </article>
      </div>

      <div class="roxy-global-visual" aria-label="品牌内容连接全球创作者示意图">
        <div class="roxy-world-grid" aria-hidden="true"><span class="roxy-world-shape" /></div>
        <svg
          class="roxy-connection-lines"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M180 110 C300 50 330 230 470 145 S690 45 820 130" />
          <path d="M220 220 C350 230 390 70 520 155 S690 250 790 190" />
          <path d="M470 145 C580 30 680 35 820 130" />
          <circle cx="180" cy="110" r="4" />
          <circle cx="220" cy="220" r="4" />
          <circle cx="470" cy="145" r="5" />
          <circle cx="820" cy="130" r="5" />
        </svg>
        <div class="roxy-brand-node">
          <Sparkles class="size-5" />
          <span>你的品牌</span>
        </div>
        <div class="roxy-creator-node creator-one">
          <span class="roxy-creator-face face-one">AM</span>
          <span>
            <b>🇺🇸 美国</b>
            <small>Instagram · 美妆</small>
          </span>
        </div>
        <div class="roxy-creator-node creator-two">
          <span class="roxy-creator-face face-two">EL</span>
          <span>
            <b>🇩🇪 德国</b>
            <small>YouTube · 生活方式</small>
          </span>
        </div>
        <div class="roxy-creator-node creator-three">
          <span class="roxy-creator-face face-three">MJ</span>
          <span>
            <b>🇧🇷 巴西</b>
            <small>TikTok · 创作者</small>
          </span>
        </div>
        <div class="roxy-creator-node creator-four">
          <span class="roxy-creator-face face-four">SK</span>
          <span>
            <b>🇦🇺 澳大利亚</b>
            <small>X · 家居</small>
          </span>
        </div>
        <div class="roxy-creator-node creator-five">
          <span class="roxy-creator-face face-five">NO</span>
          <span>
            <b>🇫🇷 法国</b>
            <small>Instagram · 穿搭</small>
          </span>
        </div>
        <div class="roxy-global-caption">
          <span class="roxy-live-dot" />
          连接品牌与全球创作者
        </div>
      </div>

      <div class="roxy-platform-strip" id="resources">
        <span>一份素材 · 五平台矩阵分发</span>
        <div>
          <b class="platform-tiktok">♪</b>
          TikTok
        </div>
        <div>
          <b class="platform-youtube">▶</b>
          YouTube
        </div>
        <div>
          <b class="platform-instagram">◎</b>
          Instagram
        </div>
        <div>
          <b class="platform-facebook">f</b>
          Facebook
        </div>
        <div>
          <b class="platform-x">𝕏</b>
          X (Twitter)
        </div>
      </div>
    </section>

    <section id="features" class="roxy-feature-section" hidden>
      <div class="roxy-section-heading">
        <span>CREATE ONCE · DISTRIBUTE EVERYWHERE</span>
        <h2>一份产品素材，铺开五大社媒声量</h2>
        <p>多语言视频批量制作，多账号协同发布，让用户在熟悉的平台找到你的品牌。</p>
      </div>
      <div class="roxy-metric-row">
        <article>
          <strong>
            1800
            <span>万+</span>
          </strong>
          <span>多语内容版本</span>
        </article>
        <article>
          <strong>
            300
            <span>+</span>
          </strong>
          <span>内容制作形式</span>
        </article>
        <article>
          <strong>
            70
            <span>%</span>
          </strong>
          <span>内容生产成本降低</span>
        </article>
      </div>

      <div class="roxy-workflow-card" id="workflow">
        <div class="roxy-workflow-heading">
          <div>
            <span>ROXY CONTENT ENGINE</span>
            <h3>从一份素材，到多语作品与五平台发布</h3>
          </div>
          <RouterLink to="/auth?mode=register">
            开启免费试用
            <ArrowRight class="size-4" />
          </RouterLink>
        </div>
        <div class="roxy-workflow-grid">
          <article class="roxy-workflow-step roxy-product-step">
            <span class="roxy-step-label">01 · 产品素材</span>
            <p>可自带，也可配套制作</p>
            <div class="roxy-product-visual">
              <div class="roxy-product-orb">
                <span class="roxy-product-headband" />
                <span class="roxy-product-earcup left" />
                <span class="roxy-product-earcup right" />
                <span class="roxy-product-band" />
              </div>
              <span class="roxy-product-caption">PRODUCT ASSET</span>
            </div>
          </article>
          <article class="roxy-workflow-step roxy-video-step">
            <span class="roxy-step-label">02 · 多语成片</span>
            <p>美妆测评 · 服装穿搭 · 3C 开箱 · AI 短剧</p>
            <div class="roxy-video-cards">
              <div
                v-for="(language, index) in ['英语版', '西语版', '日语版']"
                :key="language"
                class="roxy-video-card"
                :class="`video-${index + 1}`"
              >
                <img :src="`/images/creation-covers/cover-${index + 1}.jpg`" :alt="`${language}内容示意图`" />
                <span class="roxy-video-language">{{ language }}</span>
                <span class="roxy-video-play"><Play class="size-3.5" fill="currentColor" /></span>
                <span class="roxy-video-caption">
                  {{ ['Try it now', 'Pruébalo ya', '今すぐ試す'][index] }}
                </span>
              </div>
            </div>
          </article>
          <article class="roxy-workflow-step roxy-publish-step">
            <span class="roxy-step-label">03 · 五平台发布</span>
            <p>按平台规则适配，多账号同步发布</p>
            <div class="roxy-publish-list">
              <div
                v-for="platform in [
                  { name: 'TikTok', mark: '♪', className: 'platform-tiktok' },
                  { name: 'YouTube', mark: '▶', className: 'platform-youtube' },
                  { name: 'Instagram', mark: '◎', className: 'platform-instagram' },
                  { name: 'Facebook', mark: 'f', className: 'platform-facebook' },
                  { name: 'X (Twitter)', mark: '𝕏', className: 'platform-x' },
                ]"
                :key="platform.name"
              >
                <b :class="platform.className">{{ platform.mark }}</b>
                <span>{{ platform.name }}</span>
                <span>内容已适配</span>
                <small>
                  <Check class="size-3" />
                  已发布
                </small>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="roxy-benefit-grid" id="solutions">
        <article class="roxy-benefit-card roxy-chart-card">
          <span>发布后的曝光走势</span>
          <p>内容分发效果持续可见</p>
          <svg viewBox="0 0 440 150" role="img" aria-label="内容曝光逐周增长趋势">
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stop-color="#1c9dff" stop-opacity=".25" />
                <stop offset="1" stop-color="#1c9dff" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M12 125 L110 102 L220 82 L330 30 L425 8 L425 145 L12 145 Z" fill="url(#chartFill)" />
            <path d="M12 125 L110 102 L220 82 L330 30 L425 8" fill="none" stroke="#168df2" stroke-width="3" />
            <circle cx="12" cy="125" r="4" fill="#fff" stroke="#168df2" stroke-width="2" />
            <circle cx="110" cy="102" r="4" fill="#fff" stroke="#168df2" stroke-width="2" />
            <circle cx="220" cy="82" r="4" fill="#fff" stroke="#168df2" stroke-width="2" />
            <circle cx="330" cy="30" r="4" fill="#fff" stroke="#168df2" stroke-width="2" />
            <circle cx="425" cy="8" r="8" fill="#168df2" stroke="#c8e9ff" stroke-width="6" />
          </svg>
          <div class="roxy-chart-labels">
            <span>第1周 · 100万</span>
            <span>第2周 · 220万</span>
            <span>第3周 · 460万</span>
            <span>第4周 · 850万</span>
          </div>
        </article>
        <article class="roxy-benefit-card roxy-language-card">
          <span>AI 短剧 · 多语传播</span>
          <p>一个故事，多种语言与片段</p>
          <div class="roxy-language-stack">
            <div
              v-for="(flag, index) in ['🇮🇹 IT', '🇺🇸 EN', '🇯🇵 JA']"
              :key="flag"
              :class="`stack-${index + 1}`"
            >
              <Bot class="size-6" />
              <b>{{ flag }}</b>
            </div>
          </div>
          <div class="roxy-language-counts">
            <div>
              <strong>1</strong>
              <span>个故事</span>
            </div>
            <div>
              <strong>5</strong>
              <span>种语言</span>
            </div>
            <div>
              <strong>30</strong>
              <span>条片段</span>
            </div>
          </div>
        </article>
        <article class="roxy-benefit-card roxy-savings-card">
          <span>同样的内容量，成本差多少？</span>
          <p>以原生产方式成本 100 为基准</p>
          <div class="roxy-cost-row">
            <span>原生产方式</span>
            <b>100</b>
          </div>
          <div class="roxy-cost-bar"><i /></div>
          <div class="roxy-cost-row">
            <span>批量生成与多语适配</span>
            <b>约 30</b>
          </div>
          <div class="roxy-cost-bar is-short"><i /></div>
          <strong class="roxy-saving-number">70%</strong>
          <small>相较原生产方式降低的内容生产成本</small>
        </article>
      </div>

      <div class="roxy-bottom-cta" id="pricing">
        <div>
          <strong>让每一份内容，都连接更多用户。</strong>
          <span>
            <Check class="size-3.5" />
            成片
            <Check class="size-3.5" />
            发布排期
            <Check class="size-3.5" />
            帖子链接
            <Check class="size-3.5" />
            发布记录
          </span>
        </div>
        <RouterLink to="/auth?mode=register">
          免费试用
          <ArrowRight class="size-4" />
        </RouterLink>
      </div>
      <div id="download" class="h-px" />
    </section>
  </main>
</template>

<style scoped>
.roxy-website {
  height: 100vh;
  height: 100svh;
  overflow: hidden;
  background: #fff;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}
.roxy-website-hero {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 75% 43%, #edf7ff 0%, transparent 37%),
    linear-gradient(180deg, #fff 0%, #fcfdff 100%);
  padding: 82px max(5vw, 24px) 14px;
  color: #10294d;
}
.roxy-website-hero::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #147fca35 1px, transparent 1.5px);
  background-position: 50% 15%;
  background-size: 74px 74px;
  opacity: 0.14;
  content: '';
  mask-image: linear-gradient(180deg, #000 0%, transparent 76%);
}
.roxy-site-header {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 10;
  display: flex;
  width: min(1080px, calc(100% - 40px));
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  transform: translateX(-50%);
  border: 1px solid #e5edf5;
  border-radius: 14px;
  background: rgb(255 255 255 / 92%);
  padding: 6px 9px;
  box-shadow: 0 8px 28px #173c5b0d;
  backdrop-filter: blur(14px);
}
.roxy-site-brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  color: #10294d;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.roxy-site-brand img {
  width: 28px;
  height: 28px;
}
.roxy-site-nav {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-around;
  gap: 5px;
}
.roxy-site-nav a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #52657b;
  font-size: 11px;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s;
}
.roxy-site-nav a:hover {
  color: #52657b;
}
.roxy-tiktok-mark {
  color: #ff7794;
  font-size: 20px;
  font-weight: 800;
}
.roxy-site-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}
.roxy-language,
.roxy-login,
.roxy-register {
  display: inline-flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #dbe6f0;
  border-radius: 7px;
  background: #fff;
  padding: 0 9px;
  color: #52657b;
  font-size: 11px;
  text-decoration: none;
}
.roxy-language {
  border-color: transparent;
  background: transparent;
}
.roxy-register {
  border-color: #198df0;
  background: linear-gradient(110deg, #18a9f5, #227af1);
  font-weight: 700;
}
.roxy-mobile-menu,
.roxy-mobile-nav {
  display: none;
}
.roxy-hero-copy {
  position: relative;
  z-index: 1;
  max-width: 850px;
  margin: 0 auto;
  text-align: center;
}
.roxy-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #1889dd;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.17em;
}
.roxy-hero-copy h1 {
  margin: 14px 0 0;
  background: linear-gradient(110deg, #10294d 15%, #176bb7 85%);
  background-clip: text;
  color: transparent;
  font-size: clamp(40px, 6vw, 70px);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.15;
  text-shadow: none;
}
.roxy-hero-copy p {
  margin: 14px 0 0;
  color: #64748b;
  font-size: clamp(14px, 2vw, 18px);
  letter-spacing: 0.04em;
}
.roxy-hero-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
}
.roxy-resource-button,
.roxy-trial-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #d6e4f0;
  border-radius: 8px;
  padding: 0 15px;
  color: #27506f;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.roxy-resource-button {
  background: #fff;
}
.roxy-trial-button {
  border-color: transparent;
  background: linear-gradient(105deg, #168fff, #8c65ee);
  box-shadow: 0 7px 18px #297ce34a;
}
.roxy-hero-stats {
  position: relative;
  z-index: 2;
  display: grid;
  max-width: 900px;
  grid-template-columns: 1fr 1fr 1fr;
  width: min(900px, 100%);
  margin: 30px auto 0;
  border-top: 1px solid #e4edf5;
  border-bottom: 1px solid #e4edf5;
}
.roxy-stat-card {
  display: flex;
  min-height: 102px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-right: 1px solid #e4edf5;
  padding: 12px 18px;
}
.roxy-stat-card:last-child {
  border-right: 0;
}
.roxy-stat-icon {
  display: grid;
  width: 37px;
  height: 37px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #cce7fa;
  border-radius: 12px;
  background: #edf7ff;
  color: #238be0;
}
.roxy-stat-card strong {
  display: block;
  font-size: 31px;
  font-weight: 800;
  line-height: 1;
}
.roxy-stat-card strong span {
  font-size: 0.56em;
}
.roxy-stat-card p {
  margin: 5px 0 1px;
  color: #52657b;
  font-size: 11px;
}
.roxy-stat-card small {
  color: #8494a6;
  font-size: 9px;
}
.roxy-global-visual {
  position: relative;
  width: min(100%, 920px);
  height: 254px;
  margin: 8px auto 0;
  border-radius: 28px;
  background: radial-gradient(ellipse at center, #eff8ff 0%, #f8fbff 52%, transparent 76%);
}
.roxy-world-grid {
  position: absolute;
  inset: 6% 6% 4%;
  overflow: hidden;
  background-image: radial-gradient(circle, #57bcff99 1px, transparent 1.5px);
  background-position: center;
  background-size: 7px 7px;
  opacity: 0.28;
  mask-image: radial-gradient(ellipse at center, #000 10%, transparent 71%);
}
.roxy-world-shape {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 26% 42%, #39aefb30 0 13%, transparent 13.5%),
    radial-gradient(ellipse at 42% 49%, #39aefb20 0 10%, transparent 10.5%),
    radial-gradient(ellipse at 69% 40%, #39aefb23 0 18%, transparent 18.5%),
    radial-gradient(ellipse at 79% 70%, #39aefb20 0 11%, transparent 11.5%);
}
.roxy-connection-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.roxy-connection-lines path {
  fill: none;
  stroke: #20a9ff;
  stroke-width: 1.4;
  opacity: 0.58;
}
.roxy-connection-lines circle {
  fill: #3dc1ff;
}
.roxy-brand-node {
  position: absolute;
  top: 42%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #b5e9ff;
  border-radius: 24px;
  background: linear-gradient(110deg, #16aaf7, #087dd5);
  padding: 9px 15px;
  color: white;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 24px #159dfb65;
  transform: translate(-50%, -50%);
}
.roxy-creator-node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #d8efff;
  border-radius: 30px;
  background: #ffffff;
  padding: 4px 12px 4px 4px;
  color: #19344b;
  box-shadow: 0 8px 25px #194c711c;
  white-space: nowrap;
}
.roxy-creator-node b,
.roxy-creator-node small {
  display: block;
}
.roxy-creator-node b {
  font-size: 10px;
}
.roxy-creator-node small {
  margin-top: 2px;
  color: #73889a;
  font-size: 8px;
}
.roxy-creator-face {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 0 0 1px #9bd9ff;
}
.face-one {
  background: linear-gradient(140deg, #ffbf82, #a84345);
}
.face-two {
  background: linear-gradient(140deg, #efd09e, #735144);
}
.face-three {
  background: linear-gradient(140deg, #81daa7, #bd554b);
}
.face-four {
  background: linear-gradient(140deg, #d58cc5, #405b9d);
}
.face-five {
  background: linear-gradient(140deg, #f2b0a1, #584378);
}
.creator-one {
  top: 18%;
  left: 6%;
}
.creator-two {
  top: 5%;
  left: 38%;
}
.creator-three {
  top: 59%;
  left: 18%;
}
.creator-four {
  top: 57%;
  right: 9%;
}
.creator-five {
  top: 13%;
  right: 4%;
}
.roxy-global-caption {
  position: absolute;
  right: 0;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #63819a;
  font-size: 9px;
}
.roxy-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38d8b1;
  box-shadow: 0 0 8px #38d8b1;
}
.roxy-platform-strip {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 60px;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 3.1vw, 42px);
  margin-top: auto;
  border-top: 1px solid #e5edf5;
  color: #52657b;
  font-size: 11px;
}
.roxy-platform-strip > span {
  color: #8293a7;
  font-size: 9px;
}
.roxy-platform-strip > div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.roxy-platform-strip b {
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border-radius: 5px;
  background: #fff;
  font-size: 14px;
}
.platform-tiktok {
  color: #111;
}
.platform-youtube {
  color: #ff0033;
}
.platform-instagram {
  color: #ce318f;
}
.platform-facebook {
  color: #1877f2;
}
.platform-x {
  color: #111;
}
.roxy-scroll-cue {
  position: absolute;
  right: max(5vw, 24px);
  bottom: 15px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid #ffffff40;
  border-radius: 50%;
  color: #bde6ff;
}
.roxy-scroll-cue {
  display: none;
}
.roxy-feature-section {
  max-width: 1240px;
  margin: 0 auto;
  padding: 54px 24px 36px;
}
.roxy-section-heading {
  text-align: center;
}
.roxy-section-heading > span,
.roxy-workflow-heading > div > span {
  color: #198bd0;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.17em;
}
.roxy-section-heading h2 {
  margin: 8px 0 5px;
  color: #10294d;
  font-size: clamp(23px, 3vw, 34px);
  font-weight: 800;
}
.roxy-section-heading p {
  margin: 0;
  color: #748598;
  font-size: 13px;
}
.roxy-metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 27px 0 20px;
  border: 1px solid #e8eef5;
  border-radius: 18px;
  background: white;
  padding: 14px;
  box-shadow: 0 10px 36px #1558860b;
}
.roxy-metric-row article {
  display: grid;
  min-height: 64px;
  align-content: center;
  justify-items: center;
  border-right: 1px solid #e7edf3;
}
.roxy-metric-row article:last-child {
  border: 0;
}
.roxy-metric-row strong {
  color: #112a4d;
  font-size: 27px;
  font-weight: 800;
}
.roxy-metric-row strong span {
  font-size: 0.65em;
}
.roxy-metric-row article > span {
  margin-top: 1px;
  color: #7d8998;
  font-size: 10px;
}
.roxy-workflow-card {
  border: 1px solid #e7edf4;
  border-radius: 19px;
  background: white;
  padding: 22px;
  box-shadow: 0 12px 36px #1849750b;
}
.roxy-workflow-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 16px;
}
.roxy-workflow-heading h3 {
  margin: 4px 0 0;
  color: #10294d;
  font-size: 18px;
  font-weight: 750;
}
.roxy-workflow-heading > a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #147fe0;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}
.roxy-workflow-grid {
  display: grid;
  grid-template-columns: 0.72fr 1.78fr 1.2fr;
  gap: 12px;
}
.roxy-workflow-step {
  min-width: 0;
  min-height: 250px;
  border-radius: 13px;
  background: #f5f7fa;
  padding: 15px;
}
.roxy-step-label {
  color: #203245;
  font-size: 11px;
  font-weight: 800;
}
.roxy-workflow-step > p {
  margin: 6px 0 12px;
  color: #7e8b99;
  font-size: 10px;
}
.roxy-product-visual {
  position: relative;
  display: grid;
  height: 154px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #edf0f2;
  border-radius: 10px;
  background: radial-gradient(circle at 55% 42%, #fff, #ecf0f4);
}
.roxy-product-orb {
  position: relative;
  width: 112px;
  height: 98px;
}
.roxy-product-band {
  position: absolute;
  top: 9px;
  left: 28px;
  width: 57px;
  height: 70px;
  border: 12px solid #d5dde3;
  border-bottom-color: transparent;
  border-radius: 45px 45px 18px 18px;
  transform: rotate(-20deg);
}
.roxy-product-earcup {
  position: absolute;
  z-index: 1;
  top: 54px;
  width: 28px;
  height: 38px;
  border: 5px solid #bcc8d1;
  border-radius: 11px;
  background: linear-gradient(90deg, #f9fafb, #bdc8d0);
  box-shadow: 0 5px 10px #3b485326;
}
.roxy-product-earcup.left {
  left: 15px;
  transform: rotate(-15deg);
}
.roxy-product-earcup.right {
  right: 14px;
  transform: rotate(-15deg);
}
.roxy-product-caption {
  position: absolute;
  top: 8px;
  left: 8px;
  border-radius: 9px;
  background: #273749a8;
  padding: 4px 7px;
  color: white;
  font-size: 8px;
}
.roxy-video-step {
  background: #f0f4f8;
}
.roxy-video-cards {
  display: grid;
  height: 182px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.roxy-video-card {
  position: relative;
  overflow: hidden;
  border-radius: 9px;
  background: #192a38;
}
.roxy-video-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.83);
  transition: transform 0.3s;
}
.roxy-video-card:hover img {
  transform: scale(1.04);
}
.roxy-video-language {
  position: absolute;
  top: 8px;
  left: 7px;
  border-radius: 12px;
  background: #111b27c9;
  padding: 4px 6px;
  color: white;
  font-size: 8px;
}
.roxy-video-play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid #ffffff99;
  border-radius: 50%;
  background: #ffffff29;
  color: white;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px);
}
.roxy-video-caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: #080c11c9;
  padding: 7px 3px;
  color: white;
  font-size: 9px;
  text-align: center;
}
.roxy-publish-list {
  display: grid;
  gap: 5px;
}
.roxy-publish-list > div {
  display: grid;
  min-height: 31px;
  grid-template-columns: 18px 1fr 1fr auto;
  align-items: center;
  gap: 6px;
  border: 1px solid #e4e9ee;
  border-radius: 7px;
  background: white;
  padding: 4px 7px;
  font-size: 8px;
}
.roxy-publish-list b {
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border-radius: 4px;
  background: #f1f3f6;
  font-size: 11px;
}
.roxy-publish-list > div > span:nth-child(3) {
  color: #8491a0;
}
.roxy-publish-list small {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #10a96a;
  white-space: nowrap;
}
.roxy-benefit-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr 1.15fr;
  gap: 14px;
  margin-top: 16px;
}
.roxy-benefit-card {
  min-width: 0;
  min-height: 218px;
  border: 1px solid #e8edf3;
  border-radius: 17px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 9px 30px #1849750a;
}
.roxy-benefit-card > span {
  color: #1b3048;
  font-size: 13px;
  font-weight: 800;
}
.roxy-benefit-card > p {
  margin: 4px 0 10px;
  color: #8793a1;
  font-size: 10px;
}
.roxy-chart-card svg {
  width: 100%;
  height: 120px;
  margin-top: 5px;
  overflow: visible;
}
.roxy-chart-labels {
  display: flex;
  justify-content: space-between;
  color: #788696;
  font-size: 8px;
}
.roxy-language-stack {
  position: relative;
  display: flex;
  height: 92px;
  align-items: center;
  justify-content: center;
  perspective: 400px;
}
.roxy-language-stack > div {
  position: absolute;
  display: flex;
  width: 66px;
  height: 82px;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  border: 1px solid #dbe6f3;
  border-radius: 10px;
  background: linear-gradient(155deg, #eaf5ff, #fff);
  color: #29527d;
  box-shadow: 0 7px 15px #203b5b1a;
}
.roxy-language-stack > div b {
  font-size: 9px;
}
.stack-1 {
  transform: translateX(-32px) rotate(-12deg);
}
.stack-2 {
  z-index: 1;
  transform: translateY(-3px);
}
.stack-3 {
  transform: translateX(32px) rotate(12deg);
}
.roxy-language-counts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.roxy-language-counts > div {
  display: grid;
  justify-items: center;
  border-right: 1px solid #e5ebf1;
}
.roxy-language-counts > div:last-child {
  border: 0;
}
.roxy-language-counts strong {
  color: #162f4e;
  font-size: 21px;
}
.roxy-language-counts span {
  color: #8490a0;
  font-size: 9px;
}
.roxy-savings-card {
  background: linear-gradient(145deg, #142d51, #091a33);
  color: white;
}
.roxy-savings-card > span {
  color: white;
}
.roxy-savings-card > p {
  color: #a8b9d0;
}
.roxy-cost-row {
  display: flex;
  justify-content: space-between;
  margin-top: 9px;
  color: #e8f0fb;
  font-size: 10px;
}
.roxy-cost-bar {
  height: 9px;
  margin-top: 5px;
  overflow: hidden;
  border-radius: 9px;
  background: #627d9f;
}
.roxy-cost-bar i {
  display: block;
  width: 100%;
  height: 100%;
  background: #849dbb;
}
.roxy-cost-bar.is-short {
  background: #314d70;
}
.roxy-cost-bar.is-short i {
  width: 30%;
  border-radius: 9px;
  background: #23a5f5;
}
.roxy-saving-number {
  display: block;
  margin-top: 9px;
  font-size: 34px;
  line-height: 1;
}
.roxy-savings-card > small {
  color: #a8b9d0;
  font-size: 9px;
}
.roxy-bottom-cta {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 15px;
  border: 1px solid #e6edf4;
  border-radius: 15px;
  background: #fff;
  padding: 13px 17px;
}
.roxy-bottom-cta > div {
  display: flex;
  align-items: center;
  gap: 18px;
}
.roxy-bottom-cta strong {
  color: #1a3048;
  font-size: 13px;
}
.roxy-bottom-cta span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1688e5;
  font-size: 9px;
}
.roxy-bottom-cta > a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 7px;
  background: linear-gradient(100deg, #149bfa, #6677f5);
  padding: 9px 13px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .roxy-site-nav {
    gap: 2px;
  }
  .roxy-site-nav a {
    font-size: 9px;
  }
  .roxy-site-nav a:nth-child(n + 5) {
    display: none;
  }
  .roxy-website-hero {
    min-height: 0;
    padding: 76px 18px 10px;
  }
  .roxy-hero-stats {
    margin-top: 28px;
  }
  .roxy-stat-card {
    gap: 7px;
    padding: 10px 8px;
  }
  .roxy-stat-icon {
    width: 30px;
    height: 30px;
  }
  .roxy-stat-card strong {
    font-size: 25px;
  }
  .roxy-stat-card small {
    font-size: 8px;
  }
  .roxy-global-visual {
    height: 230px;
  }
  .roxy-workflow-grid {
    grid-template-columns: 0.8fr 1.4fr;
  }
  .roxy-publish-step {
    grid-column: 1 / -1;
    min-height: auto;
  }
  .roxy-publish-list {
    grid-template-columns: repeat(2, 1fr);
  }
  .roxy-benefit-grid {
    grid-template-columns: 1fr 1fr;
  }
  .roxy-savings-card {
    grid-column: 1 / -1;
    min-height: 190px;
  }
}
@media (max-width: 600px) {
  .roxy-website-hero {
    min-height: 0;
    padding-top: 72px;
  }
  .roxy-site-header {
    top: 9px;
    width: calc(100% - 20px);
    min-height: 48px;
    gap: 8px;
  }
  .roxy-site-brand {
    font-size: 12px;
  }
  .roxy-site-brand img {
    width: 24px;
    height: 24px;
  }
  .roxy-site-nav,
  .roxy-site-actions {
    display: none;
  }
  .roxy-mobile-menu {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid #dbe6f0;
    border-radius: 7px;
    background: #fff;
    color: #52657b;
  }
  .roxy-mobile-nav {
    position: absolute;
    top: 56px;
    right: 0;
    left: 0;
    display: grid;
    gap: 3px;
    border: 1px solid #e1eaf3;
    border-radius: 12px;
    background: rgb(255 255 255 / 98%);
    padding: 9px;
    box-shadow: 0 12px 30px #173c5b18;
  }
  .roxy-mobile-nav a {
    border-radius: 6px;
    padding: 9px;
    color: #52657b;
    font-size: 12px;
    text-decoration: none;
  }
  .roxy-mobile-nav a:hover {
    background: #f2f8fd;
  }
  .roxy-hero-eyebrow {
    font-size: 8px;
    letter-spacing: 0.11em;
  }
  .roxy-hero-copy h1 {
    margin-top: 12px;
    font-size: 43px;
  }
  .roxy-hero-copy p {
    max-width: 280px;
    margin: 10px auto 0;
    font-size: 13px;
    line-height: 1.7;
  }
  .roxy-hero-buttons {
    margin-top: 15px;
  }
  .roxy-resource-button,
  .roxy-trial-button {
    min-height: 36px;
    gap: 5px;
    padding: 0 9px;
    font-size: 10px;
  }
  .roxy-hero-stats {
    margin-top: 22px;
  }
  .roxy-stat-card {
    min-height: 86px;
    flex-direction: column;
    gap: 3px;
    text-align: center;
  }
  .roxy-stat-icon {
    display: none;
  }
  .roxy-stat-card strong {
    font-size: 23px;
  }
  .roxy-stat-card p {
    font-size: 9px;
  }
  .roxy-stat-card small {
    display: none;
  }
  .roxy-global-visual {
    height: 210px;
    margin-top: 2px;
  }
  .roxy-creator-node {
    gap: 4px;
    padding: 3px 7px 3px 3px;
  }
  .roxy-creator-face {
    width: 28px;
    height: 28px;
    font-size: 8px;
  }
  .roxy-creator-node b {
    font-size: 8px;
  }
  .roxy-creator-node small {
    font-size: 7px;
  }
  .creator-one {
    top: 13%;
    left: 0;
  }
  .creator-two {
    top: 1%;
    left: 35%;
  }
  .creator-three {
    top: 57%;
    left: 3%;
  }
  .creator-four {
    top: 58%;
    right: 0;
  }
  .creator-five {
    top: 12%;
    right: 0;
  }
  .roxy-brand-node {
    top: 42%;
    padding: 7px 9px;
    font-size: 9px;
  }
  .roxy-brand-node svg {
    width: 15px;
  }
  .roxy-platform-strip {
    min-height: 57px;
    flex-wrap: wrap;
    gap: 9px 12px;
    padding: 8px 0;
    font-size: 9px;
  }
  .roxy-platform-strip > span {
    flex-basis: 100%;
    text-align: center;
  }
  .roxy-platform-strip b {
    width: 16px;
    height: 16px;
    font-size: 11px;
  }
  .roxy-scroll-cue {
    display: none;
  }
  .roxy-feature-section {
    padding: 37px 13px 22px;
  }
  .roxy-section-heading h2 {
    font-size: 22px;
  }
  .roxy-section-heading p {
    font-size: 10px;
    line-height: 1.7;
  }
  .roxy-metric-row {
    margin: 18px 0 13px;
    padding: 8px 2px;
  }
  .roxy-metric-row article {
    min-height: 56px;
  }
  .roxy-metric-row strong {
    font-size: 20px;
  }
  .roxy-metric-row article > span {
    font-size: 8px;
  }
  .roxy-workflow-card {
    padding: 13px 10px;
  }
  .roxy-workflow-heading {
    align-items: flex-start;
  }
  .roxy-workflow-heading h3 {
    font-size: 13px;
  }
  .roxy-workflow-heading > a {
    gap: 3px;
    font-size: 9px;
    white-space: nowrap;
  }
  .roxy-workflow-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .roxy-workflow-step {
    min-height: auto;
    padding: 12px;
  }
  .roxy-product-visual {
    height: 145px;
  }
  .roxy-video-cards {
    height: 175px;
  }
  .roxy-publish-step {
    grid-column: auto;
  }
  .roxy-publish-list {
    grid-template-columns: 1fr;
  }
  .roxy-benefit-grid {
    grid-template-columns: 1fr;
    gap: 9px;
  }
  .roxy-benefit-card,
  .roxy-savings-card {
    grid-column: auto;
    min-height: 190px;
    padding: 15px;
  }
  .roxy-language-card {
    min-height: 210px;
  }
  .roxy-bottom-cta {
    align-items: flex-start;
    padding: 12px;
  }
  .roxy-bottom-cta > div {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }
  .roxy-bottom-cta strong {
    font-size: 10px;
  }
  .roxy-bottom-cta span {
    flex-wrap: wrap;
    font-size: 8px;
  }
  .roxy-bottom-cta > a {
    padding: 8px 9px;
    font-size: 9px;
  }
}
@media (max-height: 760px) {
  .roxy-website-hero {
    padding-top: 66px;
    padding-bottom: 8px;
  }
  .roxy-hero-stats {
    margin-top: 18px;
  }
  .roxy-stat-card {
    min-height: 76px;
  }
  .roxy-global-visual {
    height: clamp(145px, 22vh, 190px);
    margin-top: 4px;
  }
  .roxy-platform-strip {
    min-height: 48px;
  }
}
@media (max-width: 600px) and (max-height: 760px) {
  .roxy-website-hero {
    padding-top: 64px;
  }
  .roxy-hero-copy h1 {
    font-size: 36px;
  }
  .roxy-hero-stats {
    margin-top: 14px;
  }
  .roxy-stat-card {
    min-height: 66px;
  }
  .roxy-global-visual {
    height: 140px;
  }
  .roxy-platform-strip {
    min-height: 44px;
    gap: 4px 10px;
    padding: 4px 0;
  }
}
</style>
