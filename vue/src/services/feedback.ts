import { ref, watch } from 'vue';
import { currentUser } from './identity';
import { now, uid, writeJSON } from './storage';
import { feedbackImageLimit, isFeedbackImage, type FeedbackImage } from './feedbackImages';

export const feedbackTypes = ['使用问题', '功能建议', '支付与账号', '其他'] as const;
export type Feedback = {
  id: string;
  type: string;
  description: string;
  contact: string;
  createdAt: string;
  images?: FeedbackImage[];
};
export const feedbackRecords = ref<Feedback[]>([]);
export const feedbackReadError = ref('');
const key = (id: string) => `chuhai-feedback-v1:${id}`;
watch(
  () => currentUser.value?.id,
  (id) => {
    feedbackRecords.value = [];
    feedbackReadError.value = '';
    if (!id) return;
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key(id)) ?? '[]');
      if (
        !Array.isArray(value) ||
        !value.every(
          (item) =>
            typeof item?.id === 'string' &&
            typeof item.description === 'string' &&
            typeof item.createdAt === 'string' &&
            typeof item.type === 'string' &&
            typeof item.contact === 'string' &&
            (item.images === undefined ||
              (Array.isArray(item.images) &&
                item.images.length <= feedbackImageLimit &&
                item.images.every(isFeedbackImage))),
        )
      )
        throw new Error();
      feedbackRecords.value = value;
    } catch {
      feedbackReadError.value = '本地反馈记录读取失败，暂时无法保存新反馈，请恢复浏览器存储后刷新。';
    }
  },
  { immediate: true, flush: 'sync' },
);

export function saveFeedback(
  type: string,
  description: string,
  contact: string,
  images: FeedbackImage[] = [],
) {
  const owner = currentUser.value?.id;
  if (!owner) throw new Error('请先登录');
  if (feedbackReadError.value) throw new Error(feedbackReadError.value);
  const text = description.trim();
  if (!feedbackTypes.some((item) => item === type)) throw new Error('请选择问题类型');
  if (text.length < 10 || text.length > 2000) throw new Error('问题描述需为 10—2,000 字');
  if (contact.trim().length > 100) throw new Error('联系方式不能超过 100 字');
  if (images.length > feedbackImageLimit) throw new Error('最多添加 3 张图片');
  if (!images.every(isFeedbackImage)) throw new Error('图片无效或过大，请重新选择');
  if (
    feedbackRecords.value.some(
      (item) =>
        item.type === type &&
        item.description === text &&
        item.contact === contact.trim() &&
        JSON.stringify((item.images ?? []).map((image) => image.dataUrl).sort()) ===
          JSON.stringify(images.map((image) => image.dataUrl).sort()),
    )
  )
    throw new Error('相同反馈已保存在本地，请查看反馈记录');
  const record: Feedback = {
    id: uid(),
    type,
    description: text,
    contact: contact.trim(),
    createdAt: now(),
    ...(images.length ? { images: images.map((image) => ({ ...image })) } : {}),
  };
  const next = [record, ...feedbackRecords.value];
  if (!writeJSON(key(owner), next)) throw new Error('本地保存失败，可能是存储空间不足，请减少图片后重试');
  feedbackRecords.value = next;
  return record;
}
