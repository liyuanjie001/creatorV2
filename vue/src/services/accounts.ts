export const loginStatus = (value: string) => (value === '已授权' || value === '在线' ? '在线' : '登录过期');
