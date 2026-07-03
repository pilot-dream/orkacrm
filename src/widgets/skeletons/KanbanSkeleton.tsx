import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const KanbanSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock style={{ width: '250px', height: '32px' }} />
        <SkeletonBlock style={{ width: '120px', height: '36px' }} />
      </div>
      
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 150px)' }}>
        {[1, 2, 3, 4].map(col => (
          <div key={col} style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SkeletonBlock style={{ height: '40px' }} />
            <SkeletonBlock style={{ height: '120px' }} />
            <SkeletonBlock style={{ height: '150px' }} />
            {col % 2 === 0 && <SkeletonBlock style={{ height: '100px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
};
