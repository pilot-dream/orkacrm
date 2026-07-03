import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <SkeletonBlock style={{ width: '200px', height: '32px' }} />
        <SkeletonBlock style={{ width: '150px', height: '36px' }} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} style={{ height: '110px' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '8px' }}>
        <SkeletonBlock style={{ height: '350px' }} />
        <SkeletonBlock style={{ height: '350px' }} />
      </div>
    </div>
  );
};
