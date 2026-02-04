
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, theme }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const isDark = theme === 'dark';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe para investigar..."
          className={`w-full px-0 py-2 text-lg font-light bg-transparent transition-all duration-300 focus:outline-none border-b ${
            isDark 
              ? 'border-slate-800 text-white focus:border-indigo-500 placeholder-slate-700' 
              : 'border-slate-200 text-slate-900 focus:border-indigo-600 placeholder-slate-300'
          }`}
          disabled={isLoading}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
           {isLoading ? (
             <div className="w-4 h-4 border border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
           ) : (
             <button type="submit" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
             </button>
           )}
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
