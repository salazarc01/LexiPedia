
import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import DefinitionCard from './components/DefinitionCard';
import { getDefinition, getHomeContent } from './services/geminiService';
import { AppState, UserMeta } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lexipedia-theme');
    // Forzamos el inicio en modo claro si no hay preferencia guardada, 
    // pero respetamos si el usuario ya eligió algo antes.
    return (saved as 'light' | 'dark') || 'light';
  });

  const [state, setState] = useState<AppState>({
    searchQuery: '',
    definition: null,
    isLoading: false,
    error: null,
    history: [],
    homeContent: null,
    userMeta: {
      location: 'Cargando...',
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        userMeta: { ...prev.userMeta, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar contenido inicial y ubicación
  useEffect(() => {
    const init = async () => {
      const content = await getHomeContent();
      setState(prev => ({ ...prev, homeContent: content }));

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            setState(prev => ({
              ...prev,
              userMeta: { ...prev.userMeta, location: `${pos.coords.latitude.toFixed(1)}°, ${pos.coords.longitude.toFixed(1)}°` }
            }));
          },
          () => setState(prev => ({ ...prev, userMeta: { ...prev.userMeta, location: 'Localización OFF' } }))
        );
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('lexipedia-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#020617';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f8fafc';
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleSearch = useCallback(async (query: string) => {
    setIsSidebarOpen(false);
    if (!query) {
      setState(prev => ({ ...prev, definition: null, searchQuery: '' }));
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, error: null, searchQuery: query }));
    try {
      const result = await getDefinition(query);
      setState(prev => ({
        ...prev,
        definition: result,
        isLoading: false,
        history: [query, ...prev.history.filter(h => h !== query)].slice(0, 10)
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Error en la investigación.'
      }));
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex transition-colors duration-500 overflow-hidden ${
      isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Sidebar Overlay (Mobile Only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar estilo Wikipedia */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-transform duration-300 ease-out border-r shadow-2xl md:shadow-none ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSearch('')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">L</div>
              <h1 className="text-xl font-bold tracking-tight">LexiPedia</h1>
            </div>
            <button className="md:hidden p-2" onClick={() => setIsSidebarOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            <button 
              onClick={() => handleSearch('')}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${!state.definition ? 'bg-indigo-600 text-white shadow-lg' : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Inicio</span>
            </button>
            
            <div className={`pt-6 pb-2 px-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Búsquedas Recientes</div>
            {state.history.map((h, i) => (
              <button 
                key={i} 
                onClick={() => handleSearch(h)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors truncate text-sm flex items-center gap-2 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span className="truncate">{h}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 space-y-2">
            <button onClick={toggleTheme} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-sm border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
              <span className="font-medium">{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
              <span>{isDark ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className={`sticky top-0 z-40 p-3 md:p-4 border-b backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-200'}`}>
          <div className="max-w-5xl mx-auto flex items-center gap-3 md:gap-4">
            <button 
              className={`p-2.5 rounded-xl md:hidden transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} 
              onClick={() => setIsSidebarOpen(true)}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} isLoading={state.isLoading} theme={theme} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-10">
          <div className="max-w-5xl mx-auto">
            {!state.definition && !state.isLoading && !state.error && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`p-6 md:p-8 rounded-[2rem] border relative overflow-hidden ${isDark ? 'bg-indigo-900/10 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'}`}>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold serif mb-2">Bienvenido a LexiPedia</h2>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Investigación enciclopédica avanzada. Encuentra definiciones, historia y datos verificados al instante.
                        </p>
                      </div>
                      <div className={`flex items-center justify-between md:flex-col md:items-end font-mono text-[10px] md:text-xs pt-4 md:pt-0 border-t md:border-t-0 border-indigo-500/20 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <div className="text-left md:text-right">
                          <p className="font-bold">{state.userMeta.date}</p>
                          <p className="text-lg md:text-xl font-black">{state.userMeta.time}</p>
                        </div>
                        <p className="flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                          {state.userMeta.location}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  <div className="md:col-span-2">
                    <section className={`p-6 md:p-8 rounded-[2rem] border shadow-xl h-full transition-transform hover:scale-[1.01] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Artículo Destacado</h3>
                      </div>
                      {state.homeContent ? (
                        <div className="space-y-4">
                          <h4 className="text-3xl md:text-4xl font-bold serif leading-tight">{state.homeContent.featuredArticle.title}</h4>
                          <p className={`text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {state.homeContent.featuredArticle.summary}
                          </p>
                          <button 
                            onClick={() => handleSearch(state.homeContent?.featuredArticle.title || '')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
                          >
                            Seguir leyendo <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-4">
                           <div className="h-10 bg-slate-300 dark:bg-slate-800 rounded w-1/2"></div>
                           <div className="h-32 bg-slate-300 dark:bg-slate-800 rounded"></div>
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <section className={`p-6 rounded-[2rem] border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-500">Recurso del Día</h3>
                      {state.homeContent ? (
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold">{state.homeContent.resourceOfDay.title}</h4>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {state.homeContent.resourceOfDay.description}
                          </p>
                        </div>
                      ) : <div className="animate-pulse h-24 bg-slate-300 dark:bg-slate-800 rounded"></div>}
                    </section>

                    <section className={`p-6 rounded-[2rem] border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-amber-500">Un día como hoy</h3>
                      {state.homeContent ? (
                        <ul className="space-y-4">
                          {state.homeContent.onThisDay.map((event, i) => (
                            <li key={i} className="text-sm flex gap-3 leading-snug">
                              <span className="text-amber-500 font-bold shrink-0">•</span>
                              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{event}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <div className="animate-pulse h-32 bg-slate-300 dark:bg-slate-800 rounded"></div>}
                    </section>
                  </div>
                </div>
              </div>
            )}

            {state.isLoading && (
              <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-6">
                <div className="relative">
                  <div className={`w-16 h-16 md:w-20 md:h-20 border-4 rounded-full animate-spin ${
                    isDark ? 'border-indigo-900 border-t-indigo-500' : 'border-indigo-100 border-t-indigo-600'
                  }`}></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold italic serif">LexiPedia está investigando...</p>
                  <p className={`text-sm animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Verificando fuentes en todo el mundo.</p>
                </div>
              </div>
            )}

            {state.error && !state.isLoading && (
              <div className={`p-8 md:p-12 rounded-[2.5rem] border text-center space-y-4 max-w-lg mx-auto ${
                isDark ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-xl font-bold">Sin resultados válidos</p>
                <p className="text-sm opacity-80">{state.error}</p>
                <button onClick={() => handleSearch('')} className="mt-4 px-8 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-transform">Volver a portada</button>
              </div>
            )}

            {state.definition && !state.isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <DefinitionCard data={state.definition} theme={theme} />
              </div>
            )}
          </div>
        </main>

        <footer className={`py-10 px-6 border-t text-center ${isDark ? 'border-slate-900 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black mb-1">LexiPedia Dictionary</p>
              <p className="text-[9px] opacity-60 italic">Motor de investigación profesional v1.0 • {new Date().getFullYear()}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest">
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Privacidad</span>
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Licencias</span>
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Contacto</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
