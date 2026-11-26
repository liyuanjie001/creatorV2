import { DateTime } from 'luxon';

export type BusinessCalendar = { source: string; holidays: readonly (readonly [string, string])[]; workdays: readonly string[] };
// State Council annual notices. Missing years deliberately have no weekday-only fallback.
export const chinaBusinessCalendars: Readonly<Record<number, BusinessCalendar>> = {
  2026: {
    source: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/202511/t20251104_4258873.html',
    holidays: [['01-01', '01-03'], ['02-15', '02-23'], ['04-04', '04-06'], ['05-01', '05-05'], ['06-19', '06-21'], ['09-25', '09-27'], ['10-01', '10-07']],
    workdays: ['01-04', '02-14', '02-28', '05-09', '09-20', '10-10'],
  },
  2027: {
    source: 'https://paper.people.com.cn/rmrb/pc/content/202611/06/content_30189674.html',
    holidays: [['01-01', '01-03'], ['02-05', '02-13'], ['04-03', '04-05'], ['05-01', '05-05'], ['06-09', '06-09'], ['09-15', '09-15'], ['10-01', '10-07']],
    workdays: ['01-31', '02-14', '05-08', '09-26', '10-09'],
  },
};

export function accountDeliveryDeadline(paidAt: string, calendars = chinaBusinessCalendars): string | undefined {
  let date = DateTime.fromISO(paidAt, { zone: 'Asia/Shanghai' });
  if (!date.isValid) return undefined;
  let count = 0;
  while (count < 3) {
    date = date.plus({ days: 1 }).startOf('day');
    const calendar = calendars[date.year];
    if (!calendar) return undefined;
    const day = date.toFormat('MM-dd');
    const working = calendar.workdays.includes(day) ||
      (date.weekday <= 5 && !calendar.holidays.some(([start, end]) => day >= start && day <= end));
    if (working) count++;
  }
  return date.endOf('day').toUTC().toISO() ?? undefined;
}
