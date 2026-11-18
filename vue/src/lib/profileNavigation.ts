import { Crown, UserRound, CircleHelp, Bell } from 'lucide-vue-next';

export const profileSections = [
  { key: 'benefits', label: '我的权益', icon: Crown },
  { key: 'account', label: '账号中心', icon: UserRound },
  { key: 'help', label: '帮助与反馈', icon: CircleHelp },
  { key: 'messages', label: '消息中心', icon: Bell },
] as const;
