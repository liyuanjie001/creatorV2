export const feedbackImageLimit = 3;
export const feedbackImageMaxBytes = 500 * 1024;
export type FeedbackImage = { name: string; dataUrl: string };

export function isFeedbackImage(value: unknown): value is FeedbackImage {
  if (!value || typeof value !== 'object') return false;
  const item = value as FeedbackImage;
  return (
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    item.name.length <= 255 &&
    typeof item.dataUrl === 'string' &&
    item.dataUrl.length <= Math.ceil(feedbackImageMaxBytes / 3) * 4 + 30 &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(item.dataUrl)
  );
}

export async function prepareFeedbackImage(file: File): Promise<FeedbackImage> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('请选择 JPG、PNG 或 WebP 图片');
  if (file.size > 5 * 1024 * 1024) throw new Error('单张图片不能超过 5 MB');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error();
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const result = { name: file.name.slice(0, 255), dataUrl: canvas.toDataURL('image/jpeg', quality) };
      if (isFeedbackImage(result)) return result;
    }
    throw new Error('图片内容过大，请缩小后重试');
  } catch (error) {
    if (error instanceof Error && error.message === '图片内容过大，请缩小后重试') throw error;
    throw new Error('图片无法读取，请选择有效的图片文件');
  } finally {
    URL.revokeObjectURL(url);
  }
}
