
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
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en LexiPedia..."
          className={`w-full px-5 py-3 text-sm rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 border ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-900/30 placeholder-slate-600' 
              : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-100 placeholder-slate-400'
          }`}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
