import React from 'react';

interface BookmarkIconProps {
  isBookmarked: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  isBookmarked,
  onClick,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  // サイズに応じたクラス設定
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const baseClasses = `
    ${sizeClasses[size]}
    transition-all duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
    ${className}
  `.trim();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        p-1 rounded-full transition-colors duration-200
        ${disabled 
          ? 'cursor-not-allowed' 
          : 'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
        }
      `}
      aria-label={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
    >
      {isBookmarked ? (
        // 塗りつぶされたブックマークアイコン
        <svg
          className={`${baseClasses} fill-yellow-500 stroke-yellow-600`}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      ) : (
        // 空のブックマークアイコン
        <svg
          className={`${baseClasses} fill-none stroke-gray-400 hover:stroke-yellow-500`}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default BookmarkIcon;