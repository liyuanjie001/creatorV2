/** 一键翻拍：填入 AI 输入框的默认脚本与参考信息 */

export interface RemakeReference {
  title: string
  author: string
}

export const REMAKE_PROMPT =
  '完全复刻原视频脚本和画面，仅将原视频中的商品替换成我的商品、如有口播内容需结合我的商品进行调整（没有则不需要出现口播），同时视频不需要出现字幕，原视频有出镜人物的话，新视频也需要有。复刻后的新脚本的时长需控制在时间范围内'

export function toRemakeReference(item: { title: string; author: string }): RemakeReference {
  return { title: item.title, author: item.author }
}
