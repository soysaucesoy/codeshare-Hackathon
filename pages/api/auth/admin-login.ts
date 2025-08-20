
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    // 1. ユーザーを認証
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. ユーザーが管理者ロールを持っているか確認
    // Supabaseのユーザーメタデータに `role: 'admin'` が設定されていることを期待
    if (authData.user.user_metadata?.role !== 'admin') {
      // 管理者でない場合はサインアウトさせてアクセスを拒否
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Forbidden: Not an admin' });
    }

    // 3. 成功レスポンス
    // セッションはCookieに自動的に設定される
    return res.status(200).json({ message: 'Login successful', user: authData.user });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
