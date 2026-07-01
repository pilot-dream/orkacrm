import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Pesquisar...' }) => {
  return (
    <div className="search-box" style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '360px' }}>
      <Search size={16} className="text-secondary" style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} 
        className="search-input"
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '0.88rem',
          outline: 'none'
        }}
      />
    </div>
  );
};
