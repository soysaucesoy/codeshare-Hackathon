import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase'; // Supabaseクライアントをインポート
import { Session, User, AuthError } from '@supabase/supabase-js';
import { TokyoDistrict, DisabilityType } from '@/types/database'; // 既存の型定義をインポート

// --- 型定義 ---

/**
 * @description ユーザー登録時に渡されるプロフィール情報の型
 */
type UserProfileMetadata = {
  user_type: 'user';
  full_name: string;
  phone_number?: string;
  district?: TokyoDistrict;
  user_details: {
    age?: number;
    gender?: string;
    disability_types: DisabilityType[];
    disability_grade?: string;
    guardian_name?: string;
    guardian_phone?: string;
    emergency_contact?: string;
    medical_info?: string;
    transportation_needs?: string;
    other_requirements?: string;
    receive_notifications: boolean;
  };
};

/**
 * @description useAuthフックが提供する値の型
 */
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: UserProfileMetadata
  ) => Promise<{ user: User | null; error: Error | AuthError | null }>;
};

// --- Contextの作成 ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Providerコンポーネント ---

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ★★★ 修正ポイント: データベースへのinsert処理を削除し、metadataをoptions.dataに渡す
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: UserProfileMetadata
  ) => {
    if (!metadata) {
      return { user: null, error: new Error('サインアップにはプロフィール情報が必要です。') };
    }

    // 1. 認証ユーザーを作成。プロフィールデータはoptions.dataに含める
    // このデータはauth.usersテーブルのraw_user_meta_dataカラムに保存され、トリガーから利用される
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      return { user: null, error };
    }

    // プロフィール作成はバックエンドのトリガーが担当するため、ここではユーザー情報を返すだけ
    // 注意: メール認証が有効な場合、data.userはnullになることがあります
    return { user: data.user, error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };
  
  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signOut,
    signUpWithEmail,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// --- カスタムフック ---

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};