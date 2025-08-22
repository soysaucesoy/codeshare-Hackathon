/ components/ui/Card.tsx
import React from 'react';
import { cn } from '@/lib/utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = true,
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200',
        padding && 'p-6',
        hover && 'hover:shadow-card-hover cursor-pointer',
        'shadow-card transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;