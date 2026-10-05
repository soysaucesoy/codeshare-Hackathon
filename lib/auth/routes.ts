// lib/auth/routes.ts - 認証リダイレクトのルール（middleware と AuthProvider で共有）

// 認証が必要なルート（未ログイン時にトップへリダイレクト）
export const PROTECTED_ROUTES = ['/dashboard', '/user/mypage', '/business/mypage'];

// ログイン済みユーザーをリダイレクトするログインページ（verify-email/callbackは除外）
export const AUTH_LOGIN_PAGES = ['/auth/userlogin', '/auth/facilitylogin', '/auth/auth', '/auth/facilityregister', '/auth/register'];

// 未ログイン時のリダイレクト先
export const UNAUTHENTICATED_REDIRECT = '/';

export const isProtectedPath = (pathname: string) =>
  PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

export const isAuthLoginPage = (pathname: string) => AUTH_LOGIN_PAGES.includes(pathname);

// ログイン済みユーザーの遷移先（ユーザー種別ごと）
export const getHomePathForUserType = (userType: unknown) =>
  userType === 'facility' ? '/business/mypage' : '/';
