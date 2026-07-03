import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface SkeletonProps {
  height?: string;
}

export const CardSkeleton: React.FC<SkeletonProps> = ({ height = '150px' }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <SkeletonBlock style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
        <SkeletonBlock style={{ width: '120px', height: '16px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'center' }}>
        <SkeletonBlock style={{ width: '60%', height: '28px' }} />
        <SkeletonBlock style={{ width: '40%', height: '14px' }} />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<SkeletonProps> = ({ height = '340px' }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <SkeletonBlock style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
        <SkeletonBlock style={{ width: '200px', height: '16px' }} />
      </div>
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 0 10px 0' }}>
        {[...Array(12)].map((_, i) => (
          <SkeletonBlock
            key={i}
            style={{
              flexGrow: 1,
              height: `${Math.floor(Math.random() * 60) + 20}%`,
              opacity: 0.7
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SkeletonBlock style={{ width: '80px', height: '12px' }} />
        <SkeletonBlock style={{ width: '80px', height: '12px' }} />
      </div>
    </div>
  );
};
