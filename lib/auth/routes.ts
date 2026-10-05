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

// ユーザー種別ごとの専用ルート（別種別でアクセスした場合は自分のマイページへリダイレクト）
export const USER_TYPE_ROUTES = {
  '/user/mypage': 'user',
  '/business/mypage': 'facility',
} as const;

export type UserType = 'user' | 'facility';

// user_type が未設定・不正な場合は利用者として扱う（getHomePathForUserType と同じ判定）
export const normalizeUserType = (userType: unknown): UserType =>
  userType === 'facility' ? 'facility' : 'user';

export const getMyPagePathForUserType = (userType: unknown) =>
  normalizeUserType(userType) === 'facility' ? '/business/mypage' : '/user/mypage';

// pathname が別種別の専用ルートであれば、リダイレクト先（自分のマイページ）を返す
export const getUserTypeMismatchRedirect = (pathname: string, userType: unknown): string | null => {
  const entry = Object.entries(USER_TYPE_ROUTES).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  );
  if (!entry) return null;
  return entry[1] === normalizeUserType(userType) ? null : getMyPagePathForUserType(userType);
};
