import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', height: '100%', overflow: 'hidden' }}>
      <SkeletonBlock style={{ width: '250px', height: '32px' }} />
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonBlock key={i} style={{ height: '40px' }} />
          ))}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonBlock style={{ height: '150px' }} />
          <SkeletonBlock style={{ height: '200px' }} />
        </div>
      </div>
    </div>
  );
};
