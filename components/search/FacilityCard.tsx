// components/search/FacilityCard.tsx - 詳細リンク対応版
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Globe, MessageCircle, Heart } from 'lucide-react';
import BookmarkIcon from '../ui/BookmarkIcon';

// 型定義
interface Service {
  id: number;
  service_id: number;
  availability: 'available' | 'unavailable';
  capacity: number | null;
  current_users: number;
  service?: {
    name: string;
    category: string;
    description: string;
  };
}

interface Facility {
  id: number;
  name: string;
  description: string | null;
  appeal_points: string | null;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  website_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
}

interface FacilityCardProps {
  facility: Facility;
  onBookmark?: (facilityId: number) => void;
  onMessage?: (facilityId: number) => void;
  isBookmarked?: boolean;
  isLoggedIn?: boolean;
}

// ユーティリティ関数
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2,4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Badge コンポーネント
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

// Button コンポーネント
const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asLink?: boolean;
  href?: string;
}> = ({ variant = 'primary', size = 'md', children, onClick, className = '', asLink = false, href }) => {
  const variants = {
    primary: 'bg-green-500 text-white hover:bg-green-600',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };

  const baseStyle = `inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${variants[variant]} ${sizes[size]} ${className}`;

  if (asLink && href) {
    return (
      <Link href={href}>
        <span className={baseStyle} style={{ cursor: 'pointer', textDecoration: 'none' }}>
          {children}
        </span>
      </Link>
    );
  }

  return (
    <button className={baseStyle} onClick={onClick}>
      {children}
    </button>
  );
};

// ServiceTag コンポーネント
const ServiceTag: React.FC<{
  service?: {
    name: string;
    category: string;
    description: string;
  };
  availability: 'available' | 'unavailable';
}> = ({ service, availability }) => {
  if (!service) return null;

  const variant = availability === 'available' ? 'success' : 'default';
  const symbol = availability === 'available' ? '○' : '×';

  return (
    <Badge variant={variant} size="sm">
      <span className="mr-1">{symbol}</span>
      {service.name}
    </Badge>
  );
};

// Card コンポーネント
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
};

// メイン FacilityCard コンポーネント
const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onBookmark,
  onMessage,
  isBookmarked = false,
  isLoggedIn = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const availableServices = facility.services?.filter(s => s.availability === 'available') || [];
  const unavailableServices = facility.services?.filter(s => s.availability === 'unavailable') || [];

  const handleBookmarkClick = () => {
    if (onBookmark) {
      onBookmark(facility.id);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* 画像 */}
        <div className="sm:w-48 sm:flex-shrink-0">
          <div className="h-48 sm:h-full relative">
            {facility.image_url && !imageError ? (
              <Image
                src={facility.image_url}
                alt={facility.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <Heart size={32} className="mx-auto mb-2" />
                  <p className="text-sm">画像なし</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* ヘッダー */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Link href={`/facilities/${facility.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 cursor-pointer">
                    {facility.name}
                  </h3>
                </Link>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <MapPin size={14} className="mr-1" />
                  <span>{facility.district}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="info" size="sm">
                  最終更新: {new Date(facility.updated_at).toLocaleDateString('ja-JP')}
                </Badge>
                {/* ログイン状態でのみブックマークアイコンを表示 */}
                {isLoggedIn && (
                  <BookmarkIcon
                    isBookmarked={isBookmarked}
                    onClick={handleBookmarkClick}
                    size="md"
                  />
                )}
              </div>
            </div>

            {/* 説明 */}
            {facility.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {truncateText(facility.description, 150)}
              </p>
            )}

            {/* アピールポイント */}
            {facility.appeal_points && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">アピールポイント</h4>
                <p className="text-sm text-green-600 line-clamp-2">
                  {truncateText(facility.appeal_points, 100)}
                </p>
              </div>
            )}

            {/* サービス */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">提供サービス</h4>
              <div className="flex flex-wrap gap-2">
                {availableServices.slice(0, 3).map((service) => (
                  <ServiceTag
                    key={service.id}
                    service={service.service}
                    availability="available"
                  />
                ))}
                {unavailableServices.slice(0, 2).map((service) => (
                  <ServiceTag
                    key={service.id}
                    service={service.service}
                    availability="unavailable"
                  />
                ))}
                {(availableServices.length + unavailableServices.length) > 5 && (
                  <Badge variant="default" size="sm">
                    他 {(availableServices.length + unavailableServices.length) - 5}件
                  </Badge>
                )}
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              {facility.phone_number && (
                <div className="flex items-center">
                  <Phone size={14} className="mr-1" />
                  <span>{formatPhoneNumber(facility.phone_number)}</span>
                </div>
              )}
              {facility.website_url && (
                <div className="flex items-center">
                  <Globe size={14} className="mr-1" />
                  <a
                    href={facility.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    ウェブサイト
                  </a>
                </div>
              )}
            </div>

            {/* アクション */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
              <Button 
                variant="primary" 
                size="sm" 
                asLink 
                href={`/facilities/${facility.id}`}
              >
                詳細を見る
              </Button>
              <div className="flex items-center space-x-2">
                {onMessage && isLoggedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMessage(facility.id)}
                    className="p-2 text-gray-400 hover:text-green-600"
                  >
                    <MessageCircle size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FacilityCard;