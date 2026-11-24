import { rechargePacks, subscriptionUnitPrices, type RechargePackKey } from '@/services/credits';

const accountPrices = (Object.keys(rechargePacks) as RechargePackKey[])
  .map(tier => `${rechargePacks[tier].priceLabel} ¥${subscriptionUnitPrices.account[tier]}/个`)
  .join('、');
const seatPrices = (Object.keys(rechargePacks) as RechargePackKey[])
  .map(tier => `${rechargePacks[tier].priceLabel} ¥${subscriptionUnitPrices.quarterlySeat[tier]}/席/季`)
  .join('、');

export const purchaseFaqs = [
  {
    question: '个人版和团队版有什么区别？',
    answer: '两个版本的基础价、积分额度和功能档位相同。个人版仅限购买者本人使用；团队版可额外选择团队席位，席位数不包含购买者本人，并提供团队协作与权限权益。',
  },
  {
    question: '账号使用权和团队席位如何计费？',
    answer: `各档套餐均可选择 0–100 个账号使用权，账号费用在套餐基础价上另加，按${accountPrices}计费，每笔订单按所选数量一次收取；团队版可选择 2–100 个团队席位，按${seatPrices}计费，年度席位单价为季度的 4 倍。个人版不收取席位费用。`,
  },
  {
    question: '积分何时到账？到期后会清零吗？',
    answer: '整期积分在支付成功后一次到账，积分有效期为一年。订阅到期不会提前清除仍在有效期内的积分。',
  },
  {
    question: '订阅到期后会自动续费吗？',
    answer: '不会自动续费。你可以在购买页手动续购；相同版本和档位的有效订阅会从已购买周期的到期时间接续。',
  },
  {
    question: '可以单独充值积分吗？',
    answer: '可以。打开顶部“积分充值”页签，按原有充值档位单独购买积分，不会改变套餐版本。',
  },
  {
    question: '账号如何交付？',
    answer: '账号使用权按订单数量一次交付。支付成功后，美国 TikTok 账号会自动添加到账号管理；续购时可将数量调为 0。',
  },
] as const;
