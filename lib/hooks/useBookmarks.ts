import { useState, useEffect, useCallback } from 'react';
import { 
  getUserBookmarks, 
  getUserBookmarkFacilityIds, 
  addBookmark,
  removeBookmark,
  type Bookmark 
} from '../supabase/bookmarks';
import { useAuth } from './useAuth';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  bookmarkedFacilityIds: string[];
  loading: boolean;
  error: string | null;
  isBookmarked: (facilityId: string) => boolean;
  toggleBookmark: (facilityId: string) => Promise<void>;
  refreshBookmarks: () => Promise<void>;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedFacilityIds, setBookmarkedFacilityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブックマーク一覧を取得
  const fetchBookmarks = useCallback(async () => {
    if (!user?.id) {
      setBookmarks([]);
      setBookmarkedFacilityIds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [bookmarksData, facilityIds] = await Promise.all([
        getUserBookmarks(user.id),
        getUserBookmarkFacilityIds(user.id)
      ]);

      setBookmarks(bookmarksData);
      setBookmarkedFacilityIds(facilityIds);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('ブックマークの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 初回ロードとユーザー変更時にブックマークを取得
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // 特定の事業所がブックマークされているかチェック
  const isBookmarked = useCallback((facilityId: string): boolean => {
    return bookmarkedFacilityIds.includes(facilityId);
  }, [bookmarkedFacilityIds]);

  // ブックマークの追加/削除
  const toggleBookmark = useCallback(async (facilityId: string): Promise<void> => {
    if (!user?.id) {
      setError('ログインが必要です');
      return;
    }

    setError(null);

    try {
      // 現在の状態をローカル状態から判断（API呼び出しを避ける）
      const currentlyBookmarked = bookmarkedFacilityIds.includes(facilityId);
      
      let newBookmarkStatus: boolean;
      
      if (currentlyBookmarked) {
        // 削除
        await removeBookmark(user.id, facilityId);
        newBookmarkStatus = false;
      } else {
        // 追加
        await addBookmark(user.id, facilityId);
        newBookmarkStatus = true;
      }
      
      if (newBookmarkStatus) {
        // ブックマークが追加された場合
        setBookmarkedFacilityIds(prev => [...prev, facilityId]);
      } else {
        // ブックマークが削除された場合
        setBookmarkedFacilityIds(prev => prev.filter(id => id !== facilityId));
        setBookmarks(prev => prev.filter(bookmark => bookmark.facility !== facilityId));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('ブックマーク操作に失敗しました');
    }
  }, [user?.id, bookmarkedFacilityIds]);

  // ブックマーク一覧を再取得
  const refreshBookmarks = useCallback(async (): Promise<void> => {
    await fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    bookmarkedFacilityIds,
    loading,
    error,
    isBookmarked,
    toggleBookmark,
    refreshBookmarks,
  };
}