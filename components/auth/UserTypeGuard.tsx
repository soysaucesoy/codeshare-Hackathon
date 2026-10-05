// components/auth/UserTypeGuard.tsx - ユーザー種別ガード
// 別種別の専用ページ（例: 事業者が /user/mypage）では子コンポーネントをマウントしない。
// リダイレクト自体は middleware / AuthProvider が行うため、ここではその間の読み込み・DB書き込みを防ぐだけ。
import React from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getUserTypeMismatchRedirect } from '@/lib/auth/routes';

export const UserTypeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const router = useRouter();

  if (user && getUserTypeMismatchRedirect(router.pathname, user.user_metadata?.user_type)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export const withUserTypeGuard = <P extends object>(Page: React.ComponentType<P>) => {
  const Guarded: React.FC<P> = (props) => (
    <UserTypeGuard>
      <Page {...props} />
    </UserTypeGuard>
  );
  Guarded.displayName = `withUserTypeGuard(${Page.displayName || Page.name || 'Page'})`;
  return Guarded;
};
