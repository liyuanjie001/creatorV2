import { DateTime, IANAZone } from 'luxon';

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
const cities: [string, string, string][] = [
  ['Pacific/Honolulu', '美国 · Honolulu 檀香山', '檀香山'],
  ['America/Anchorage', '美国 · Anchorage 安克雷奇', '安克雷奇'],
  ['America/Juneau', '美国 · Juneau 朱诺', '朱诺'],
  ['America/Los_Angeles', '美国 · Los Angeles 洛杉矶', '洛杉矶'],
  ['America/Tijuana', '墨西哥 · Tijuana 蒂华纳', '蒂华纳'],
  ['America/Vancouver', '加拿大 · Vancouver 温哥华', '温哥华'],
  ['America/Hermosillo', '墨西哥 · Hermosillo 埃莫西约', '埃莫西约'],
  ['America/Phoenix', '美国 · Phoenix 凤凰城', '凤凰城'],
  ['America/Denver', '美国 · Denver 丹佛', '丹佛'],
  ['America/Chicago', '美国 · Chicago 芝加哥', '芝加哥'],
  ['America/New_York', '美国 · New York 纽约', '纽约'],
  ['America/Toronto', '加拿大 · Toronto 多伦多', '多伦多'],
  ['America/Mexico_City', '墨西哥 · Mexico City 墨西哥城', '墨西哥城'],
  ['America/Bogota', '哥伦比亚 · Bogota 波哥大', '波哥大'],
  ['America/Sao_Paulo', '巴西 · Sao Paulo 圣保罗', '圣保罗'],
  ['America/Argentina/Buenos_Aires', '阿根廷 · Buenos Aires 布宜诺斯艾利斯', '布宜诺斯艾利斯'],
  ['Europe/London', '英国 · London 伦敦', '伦敦'],
  ['Europe/Paris', '法国 · Paris 巴黎', '巴黎'],
  ['Europe/Berlin', '德国 · Berlin 柏林', '柏林'],
  ['Europe/Madrid', '西班牙 · Madrid 马德里', '马德里'],
  ['Europe/Rome', '意大利 · Rome 罗马', '罗马'],
  ['Europe/Moscow', '俄罗斯 · Moscow 莫斯科', '莫斯科'],
  ['Europe/Istanbul', '土耳其 · Istanbul 伊斯坦布尔', '伊斯坦布尔'],
  ['Africa/Cairo', '埃及 · Cairo 开罗', '开罗'],
  ['Africa/Lagos', '尼日利亚 · Lagos 拉各斯', '拉各斯'],
  ['Africa/Johannesburg', '南非 · Johannesburg 约翰内斯堡', '约翰内斯堡'],
  ['Africa/Nairobi', '肯尼亚 · Nairobi 内罗毕', '内罗毕'],
  ['Asia/Dubai', '阿联酋 · Dubai 迪拜', '迪拜'],
  ['Asia/Kolkata', '印度 · Kolkata 加尔各答', '加尔各答'],
  ['Asia/Kathmandu', '尼泊尔 · Kathmandu 加德满都', '加德满都'],
  ['Asia/Dhaka', '孟加拉国 · Dhaka 达卡', '达卡'],
  ['Asia/Bangkok', '泰国 · Bangkok 曼谷', '曼谷'],
  ['Asia/Ho_Chi_Minh', '越南 · Ho Chi Minh 胡志明市', '胡志明市'],
  ['Asia/Jakarta', '印度尼西亚 · Jakarta 雅加达', '雅加达'],
  ['Asia/Singapore', '新加坡 · Singapore', '新加坡'],
  ['Asia/Kuala_Lumpur', '马来西亚 · Kuala Lumpur 吉隆坡', '吉隆坡'],
  ['Asia/Manila', '菲律宾 · Manila 马尼拉', '马尼拉'],
  ['Asia/Shanghai', '中国 · Shanghai 上海', '上海'],
  ['Asia/Hong_Kong', '中国 · Hong Kong 香港', '香港'],
  ['Asia/Taipei', '中国 · Taipei 台北', '台北'],
  ['Asia/Tokyo', '日本 · Tokyo 东京', '东京'],
  ['Asia/Seoul', '韩国 · Seoul 首尔', '首尔'],
  ['Australia/Perth', '澳大利亚 · Perth 珀斯', '珀斯'],
  ['Australia/Adelaide', '澳大利亚 · Adelaide 阿德莱德', '阿德莱德'],
  ['Australia/Sydney', '澳大利亚 · Sydney 悉尼', '悉尼'],
  ['Pacific/Auckland', '新西兰 · Auckland 奥克兰', '奥克兰'],
  ['Pacific/Fiji', '斐济 · Fiji', '斐济'],
  ['UTC', '协调世界时 UTC', '协调世界时'],
];
export const timeZones = cities.map(([id, label, city]) => ({ id, label, city }));
export const zoneName = (id: string) => timeZones.find((z) => z.id === id)?.label ?? id.replaceAll('_', ' ');
export function zoneCity(id: string) {
  const known = timeZones.find((z) => z.id === id);
  if (known) return known.city;
  try {
    const canonical = new Intl.DateTimeFormat('zh-CN', { timeZone: id }).resolvedOptions().timeZone;
    const alias = timeZones.find((z) =>
      new Intl.DateTimeFormat('zh-CN', { timeZone: z.id }).resolvedOptions().timeZone === canonical,
    );
    if (alias) return alias.city;
    return new Intl.DateTimeFormat('zh-CN', { timeZone: id, timeZoneName: 'longGeneric' })
      .formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value ?? id;
  } catch {
    return id;
  }
}
export function formatTimeZone(zone: string, offset: string) {
  const compact = offset.replace(/([+-])0?(\d+):00$/, '$1$2').replace(/([+-])0(\d):/, '$1$2:');
  return `(${compact}) ${zoneCity(zone)}`;
}
export function localDateTime(utc: string, zone = 'Asia/Shanghai') {
  return DateTime.fromISO(utc, { zone }).toFormat("yyyy-MM-dd'T'HH:mm");
}
export function offsetLabel(utc: string, zone: string) {
  const date = DateTime.fromISO(utc || new Date().toISOString(), { zone });
  return date.isValid ? 'GMT' + date.toFormat('ZZ') : '';
}
export function scheduleCandidates(local: string, zone: string) {
  if (zone !== 'UTC' && !IANAZone.isValidZone(zone)) return [];
  const date = DateTime.fromISO(local, { zone });
  // Luxon advances nonexistent DST wall times; reject that normalization.
  if (!date.isValid || date.toFormat("yyyy-MM-dd'T'HH:mm") !== local) return [];
  return date
    .getPossibleOffsets()
    .sort((a, b) => a.toMillis() - b.toMillis())
    .map((d) => ({ utc: d.toUTC().toISO()!, offset: 'GMT' + d.toFormat('ZZ') }));
}
export function formatSchedule(utc?: string, zone = 'Asia/Shanghai') {
  if (!utc) return '—';
  const date = DateTime.fromISO(utc, { zone });
  return date.isValid
    ? date.toFormat('yyyy-MM-dd HH:mm') + ' ' + formatTimeZone(zone, offsetLabel(utc, zone))
    : '—';
}
