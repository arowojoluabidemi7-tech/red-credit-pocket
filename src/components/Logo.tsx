import React from 'react';
import { Wallet } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

const iconSizeClasses = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} gradient-red rounded-xl flex items-center justify-center shadow-red animate-pulse-glow`}>
        <Wallet size={iconSizeClasses[size]} className="text-primary-foreground" />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-foreground`}>
          Red<span className="text-gradient">Pay</span>
        </span>
      )}
    </div>
  );
};
