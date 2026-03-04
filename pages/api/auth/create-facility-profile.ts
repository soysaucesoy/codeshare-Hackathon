// pages/api/auth/create-facility-profile.ts
// サービスロールキーを使いRLSをバイパスして事業者プロファイルを作成する
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, fullName, email } = req.body;

  if (!userId || !fullName) {
    return res.status(400).json({ error: 'userId and fullName are required' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase環境変数が設定されていません');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // サービスロールクライアント（RLSをバイパス）
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. usersテーブルにレコードがなければ挿入
    //    （DBトリガーが設定されていた場合はすでに存在する可能性あり）
    const { data: existingUser, error: userSelectError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userSelectError) {
      console.error('usersテーブル確認エラー:', userSelectError);
    }

    if (!existingUser) {
      // upsertで重複を安全に処理（idベース）
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .upsert(
          { id: userId, email: email || '', full_name: fullName, user_type: 'facility' },
          { onConflict: 'id' }
        );

      if (userInsertError) {
        console.error('usersテーブルへのupsertエラー:', userInsertError);
        return res.status(500).json({ error: `ユーザーレコードの作成に失敗しました: ${userInsertError.message}` });
      }
    } else {
      // 既存レコードの user_type が 'facility' でない場合は修正する
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({ user_type: 'facility' })
        .eq('id', userId)
        .neq('user_type', 'facility');
      if (userUpdateError) {
        console.error('usersレコードのuser_type修正エラー:', userUpdateError);
      }
    }

    // 2. facilitiesテーブルにレコードがなければ挿入
    const { data: existingFacility, error: facilitySelectError } = await supabaseAdmin
      .from('facilities')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (facilitySelectError) {
      console.error('facilitiesテーブル確認エラー:', facilitySelectError);
    }

    if (!existingFacility) {
      const { error: facilityInsertError } = await supabaseAdmin.from('facilities').insert({
        user_id: userId,
        name: `${fullName}の事業所`,
        address: '住所を入力してください',
        district: '千代田区',
        is_active: false,
      });

      if (facilityInsertError) {
        console.error('facilitiesテーブルへの挿入エラー:', facilityInsertError);
        return res.status(500).json({ error: `事業所レコードの作成に失敗しました: ${facilityInsertError.message}` });
      }
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('create-facility-profile エラー:', error);
    return res.status(500).json({ error: error.message || '不明なエラーが発生しました' });
  }
}
