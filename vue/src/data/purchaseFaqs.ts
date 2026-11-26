import { rechargePacks, teamSubscriptionPacks, type TeamSubscriptionPackKey } from '@/services/credits';

const seatPrices = (Object.keys(teamSubscriptionPacks) as TeamSubscriptionPackKey[])
  .map(tier => `${rechargePacks[tier].priceLabel} ¥${teamSubscriptionPacks[tier].quarterlyAmount.toLocaleString('zh-CN')}/席位/季`)
  .join('、');

export const purchaseFaqs = [
  {
    question: '个人版和团队版有什么区别？',
    answer: '个人版提供基础版、标准版、高级版、旗舰版，仅限购买者本人使用。团队版提供标准版、高级版、旗舰版，按所选席位数计算价格和积分，席位包含购买者本人，并提供团队协作与权限权益。',
  },
  {
    question: '赠送账号抵扣券和团队席位如何计算？',
    answer: `每次购买或续购套餐均赠送 1 张账号抵扣券，基础版、标准版、高级版、旗舰版分别可兑换 2、5、10、30 个账号，团队版不提供基础版。赠送数量按每单固定，不随席位数和购买周期增加，抵扣券购买后自动兑换，不单独收费。团队版可选择 2–100 个席位（含本人），按${seatPrices}计费，年度单席价格和积分均为季度的 4 倍，总价和总积分分别按单席额度乘以席位数计算。`,
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
    answer: '支付成功后，赠送的 1 张账号抵扣券立即发放并自动兑换，无需手动使用，也没有待使用的有效期。美国 TikTok 账号将在 3 个中国法定工作日内到账，可在账号管理查看进度。账号到账前不可用于发布。',
  },
] as const;
