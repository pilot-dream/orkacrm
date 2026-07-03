import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const TarefasSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBlock style={{ width: '250px', height: '32px' }} />
        <SkeletonBlock style={{ width: '120px', height: '36px' }} />
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <SkeletonBlock style={{ width: '120px', height: '36px', borderRadius: '20px' }} />
        <SkeletonBlock style={{ width: '120px', height: '36px', borderRadius: '20px' }} />
        <SkeletonBlock style={{ width: '120px', height: '36px', borderRadius: '20px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonBlock key={i} style={{ height: '70px' }} />
        ))}
      </div>
    </div>
  );
};
