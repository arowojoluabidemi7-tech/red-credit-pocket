import React, { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface PageContainerProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  showNav = true,
  className = '' 
}) => {
  return (
    <div className={`min-h-screen bg-background ${showNav ? 'pb-20' : ''} ${className}`}>
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
};
