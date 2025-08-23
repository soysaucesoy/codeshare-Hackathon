import { supabase } from './client';

// 型定義
export interface Bookmark {
  id: string;
  user_id: string;
  facility: string;  // facility_idではなくfacility
  created_at: string;
}

export interface BookmarkInsert {
  user_id: string;
  facility: string;  // facility_idではなくfacility
}

// ブックマークを追加
export async function addBookmark(userId: string, facilityId: string) {
  const { data, error } = await supabase
    .from('bookmark')  // bookmarksではなくbookmark（単数形）
    .insert({
      user_id: userId,
      facility: facilityId,  // facility_idではなくfacility
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }

  return data as Bookmark;
}

// ブックマークを削除
export async function removeBookmark(userId: string, facilityId: string) {
  const { error } = await supabase
    .from('bookmark')  // bookmarksではなくbookmark（単数形）
    .delete()
    .eq('user_id', userId)
    .eq('facility', facilityId);  // facility_idではなくfacility

  if (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }

  return true;
}

// ユーザーのブックマーク一覧を取得
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmark')  // bookmarksではなくbookmark（単数形）
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }

  return data as Bookmark[];
}

// 特定の事業所がブックマークされているかチェック
export async function checkBookmarkStatus(userId: string, facilityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmark')  // bookmarksではなくbookmark（単数形）
    .select('id')
    .eq('user_id', userId)
    .eq('facility', facilityId)  // facility_idではなくfacility
    .single();

  if (error) {
    // レコードが存在しない場合のエラーは正常
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('Error checking bookmark status:', error);
    throw error;
  }

  return !!data;
}

// ユーザーのブックマークした事業所IDの配列を取得
export async function getUserBookmarkFacilityIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookmark')  // bookmarksではなくbookmark（単数形）
    .select('facility')  // facility_idではなくfacility
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching bookmark facility IDs:', error);
    throw error;
  }

  return data.map(item => item.facility);  // facility_idではなくfacility
}

// ブックマークのトグル（追加/削除の切り替え）
export async function toggleBookmark(userId: string, facilityId: string): Promise<boolean> {
  const isBookmarked = await checkBookmarkStatus(userId, facilityId);
  
  if (isBookmarked) {
    await removeBookmark(userId, facilityId);
    return false;
  } else {
    await addBookmark(userId, facilityId);
    return true;
  }
}