import React from 'react';

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`animate-pulse ${className}`} 
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: 'var(--border-radius-md)', 
        ...style 
      }} 
    />
  );
};
