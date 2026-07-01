import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`page-container animate-fade-in ${className}`} style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {children}
    </div>
  );
};
