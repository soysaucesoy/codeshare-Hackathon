
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

// このエンドポイントは、クライアントサイドでユーザーのセッションとロールを確認するために使用します。
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated', user: null, isAdmin: false });
    }

    // Supabaseのユーザーメタデータからロールを確認
    const user = session.user;
    const isAdmin = user?.user_metadata?.role === 'admin';

    return res.status(200).json({ user, isAdmin });

  } catch (error) {
    console.error('Error fetching user session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
