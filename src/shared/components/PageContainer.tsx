import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`page-container animate-fade-in ${className}`} style={{ padding: '16px', width: '100%', boxSizing: 'border-box' }}>
      {children}
    </div>
  );
};
