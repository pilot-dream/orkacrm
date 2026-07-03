import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const TableSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock style={{ width: '250px', height: '32px' }} />
        <SkeletonBlock style={{ width: '120px', height: '36px' }} />
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <SkeletonBlock style={{ width: '200px', height: '40px' }} />
        <SkeletonBlock style={{ width: '150px', height: '40px' }} />
        <SkeletonBlock style={{ width: '150px', height: '40px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBlock style={{ height: '50px' }} />
        {[1, 2, 3, 4, 5, 6].map(row => (
          <SkeletonBlock key={row} style={{ height: '60px' }} />
        ))}
      </div>
    </div>
  );
};
