// components/search/SearchResults.tsx - 完全統合版
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import FacilityCard from './FacilityCard';
import { FacilityWithServices } from '@/lib/hooks/useSearch';

// ページネーション情報の型定義
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchResultsProps {
  facilities: FacilityWithServices[];
  loading: boolean;
  error: string | null;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onBookmark?: (facilityId: number) => void;
  onMessage?: (facilityId: number) => void;
  bookmarkedIds?: number[];
}

// ページネーションボタンコンポーネント
const PaginationButton: React.FC<{
  page: number;
  currentPage: number;
  onClick: (page: number) => void;
  disabled?: boolean;
}> = ({ page, currentPage, onClick, disabled = false }) => {
  const isActive = page === currentPage;
  
  return (
    <button
      onClick={() => !disabled && onClick(page)}
      disabled={disabled}
      className={`
        px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive 
          ? 'bg-green-500 text-white' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      `}
    >
      {page}
    </button>
  );
};

// ページネーションコンポーネント
const Pagination: React.FC<{
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ pagination, onPageChange, loading = false }) => {
  const { page: currentPage, pages: totalPages, hasNext, hasPrev } = pagination;

  // 表示するページ番号を計算
  const getVisiblePages = () => {
    const visiblePages = [];
    const delta = 2; // 現在のページの前後に表示するページ数
    
    // 開始と終了のページを計算
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);
    
    // 前後の調整
    if (end - start < delta * 2) {
      if (start === 1) {
        end = Math.min(totalPages, start + delta * 2);
      } else if (end === totalPages) {
        start = Math.max(1, end - delta * 2);
      }
    }
    
    // ページ番号を配列に追加
    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }
    
    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* 前へボタン */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev || loading}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
          ${!hasPrev || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
          }
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        `}
      >
        <ChevronLeft size={16} className="mr-1" />
        前へ
      </button>

      {/* 最初のページ */}
      {visiblePages[0] > 1 && (
        <>
          <PaginationButton
            page={1}
            currentPage={currentPage}
            onClick={onPageChange}
            disabled={loading}
          />
          {visiblePages[0] > 2 && (
            <span className="px-2 py-2 text-gray-400">
              <MoreHorizontal size={16} />
            </span>
          )}
        </>
      )}

      {/* 表示するページ番号 */}
      {visiblePages.map((page) => (
        <PaginationButton
          key={page}
          page={page}
          currentPage={currentPage}
          onClick={onPageChange}
          disabled={loading}
        />
      ))}

      {/* 最後のページ */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 py-2 text-gray-400">
              <MoreHorizontal size={16} />
            </span>
          )}
          <PaginationButton
            page={totalPages}
            currentPage={currentPage}
            onClick={onPageChange}
            disabled={loading}
          />
        </>
      )}

      {/* 次へボタン */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext || loading}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
          ${!hasNext || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
          }
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        `}
      >
        次へ
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
};

// 表示件数選択コンポーネント
const LimitSelector: React.FC<{
  currentLimit: number;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
}> = ({ currentLimit, onLimitChange, loading = false }) => {
  const limitOptions = [10, 20, 50, 100];

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-600">表示件数:</span>
      <select
        value={currentLimit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        disabled={loading}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
      >
        {limitOptions.map((limit) => (
          <option key={limit} value={limit}>
            {limit}件
          </option>
        ))}
      </select>
    </div>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({
  facilities,
  loading,
  error,
  pagination,
  onPageChange,
  onLimitChange,
  onBookmark,
  onMessage,
  bookmarkedIds = [],
}) => {
  // デフォルトのページネーション情報
  const defaultPagination = {
    page: 1,
    limit: 20,
    total: facilities.length,
    pages: Math.ceil(facilities.length / 20),
    hasNext: false,
    hasPrev: false,
  };

  const currentPagination = pagination || defaultPagination;

  // ブックマーク状態の確認
  const isBookmarked = useCallback((facilityId: number) => {
    return bookmarkedIds.includes(facilityId);
  }, [bookmarkedIds]);

  // ローディング状態
  if (loading) {
    return (
      <div className="search-results py-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-green-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="text-lg font-medium">検索中...</span>
          </div>
          <p className="text-gray-500 mt-2">事業所情報を取得しています</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="search-results py-8">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 max-w-md mx-auto">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // 検索結果なし
  if (!loading && facilities.length === 0) {
    return (
      <div className="search-results py-12">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">検索結果が見つかりませんでした</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            検索条件を変更してもう一度お試しください。<br />
            地区やサービスの条件を緩めると、より多くの結果が表示される可能性があります。
          </p>
          
          {/* 検索のヒント */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto text-left">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 検索のヒント</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 地区を「すべての地区」に変更してみてください</li>
              <li>• サービスの選択を解除してみてください</li>
              <li>• 「空きのあるもののみ」を解除してみてください</li>
              <li>• 事業所名での検索をより簡潔にしてください</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 検索結果の表示
  return (
    <div className="search-results space-y-6">
      {/* 検索結果のヘッダー */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium text-gray-900">
          {loading ? (
            <span className="animate-pulse">検索中...</span>
          ) : (
            <>
              検索結果 <span className="text-green-600 font-bold">{currentPagination.total.toLocaleString()}</span>件
              {currentPagination.total > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  ({((currentPagination.page - 1) * currentPagination.limit) + 1} - {Math.min(currentPagination.page * currentPagination.limit, currentPagination.total)}件目を表示)
                </span>
              )}
            </>
          )}
        </div>
        
        {onLimitChange && !loading && facilities.length > 0 && (
          <LimitSelector
            currentLimit={currentPagination.limit}
            onLimitChange={onLimitChange}
            loading={loading}
          />
        )}
      </div>

      {/* 事業所カード一覧 */}
      <div className="space-y-6">
        {loading ? (
          // ローディングスケルトン
          Array.from({ length: currentPagination.limit }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 sm:flex-shrink-0">
                  <div className="h-48 sm:h-full bg-gray-200"></div>
                </div>
                <div className="flex-1 p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          facilities.map((facility, index) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onBookmark={onBookmark}
              onMessage={onMessage}
              isBookmarked={isBookmarked(facility.id)}
              priority={index < 3} // 最初の3件は優先読み込み
              index={index}
            />
          ))
        )}
      </div>

      {/* ページネーション */}
      {!loading && facilities.length > 0 && onPageChange && (
        <Pagination
          pagination={currentPagination}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SearchResults;