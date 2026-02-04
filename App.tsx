
import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import DefinitionCard from './components/DefinitionCard';
import { getDefinition, getHomeContent } from './services/geminiService';
import { AppState, UserMeta } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lexipedia-theme');
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
      location: 'Ubicación...',
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        userMeta: { ...prev.userMeta, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const content = await getHomeContent();
        setState(prev => ({ ...prev, homeContent: content }));
      } catch (e) {
        console.error("Error en carga");
      }

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
    } else {
      document.documentElement.classList.remove('dark');
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
        history: [query, ...prev.history.filter(h => h !== query)].slice(0, 5)
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'No se encontraron resultados.'
      }));
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex transition-colors duration-500 selection:bg-indigo-500/20 ${
      isDark ? 'bg-black text-slate-200' : 'bg-white text-slate-900'
    }`}>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 transform transition-transform duration-300 border-r ${
        isDark ? 'bg-black border-slate-800' : 'bg-white border-slate-100'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => handleSearch('')}>
            <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black font-black text-lg">L</div>
            <h1 className="text-lg font-bold tracking-tight">LexiPedia</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <button 
              onClick={() => handleSearch('')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-sm ${!state.definition ? 'bg-slate-100 dark:bg-slate-900 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Inicio</span>
            </button>
            
            <div className={`pt-6 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Recientes</div>
            {state.history.map((h, i) => (
              <button 
                key={i} 
                onClick={() => handleSearch(h)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-3 ${isDark ? 'hover:bg-slate-900 text-slate-400 hover:text-white' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
              >
                <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                <span className="truncate">{h}</span>
              </button>
            ))}
          </nav>

          <button onClick={toggleTheme} className="mt-auto flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <span>{isDark ? 'Oscuro' : 'Claro'}</span>
            <span>{isDark ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <header className={`sticky top-0 z-40 p-4 border-b backdrop-blur-md ${isDark ? 'bg-black/80 border-slate-900' : 'bg-white/80 border-slate-100'}`}>
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(true)}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} isLoading={state.isLoading} theme={theme} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            {!state.definition && !state.isLoading && !state.error && (
              <div className="space-y-12 animate-in">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter serif">La biblioteca global, simplificada.</h2>
                  <p className="text-slate-500 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                    Investiga cualquier término y obtén información precisa. Sin publicidad, sin distracciones.
                  </p>
                  <div className="flex items-center gap-6 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700">
                    <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {state.userMeta.date}</span>
                    <span>{state.userMeta.time}</span>
                    <span>{state.userMeta.location}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {state.homeContent ? (
                    <>
                      <section className={`p-8 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-500">Destacado</h3>
                        <h4 className="text-2xl font-bold mb-3 serif">{state.homeContent.featuredArticle.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">{state.homeContent.featuredArticle.summary}</p>
                        <button onClick={() => handleSearch(state.homeContent!.featuredArticle.title)} className="text-xs font-bold underline underline-offset-4 hover:text-indigo-500 transition-colors">Seguir leyendo</button>
                      </section>
                      <div className="space-y-8">
                        <section>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-500">Recurso</h3>
                          <h4 className="text-lg font-bold mb-1">{state.homeContent.resourceOfDay.title}</h4>
                          <p className="text-sm text-slate-500">{state.homeContent.resourceOfDay.description}</p>
                        </section>
                        <section>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-amber-500">Efemérides</h3>
                          <ul className="space-y-3">
                            {state.homeContent.onThisDay.map((e, i) => (
                              <li key={i} className="text-xs text-slate-500 flex gap-3"><span className="text-slate-300 shrink-0">/</span> {e}</li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 py-20 text-center animate-pulse text-slate-300 uppercase text-[10px] font-bold tracking-[0.5em]">Cargando Portal...</div>
                  )}
                </div>
              </div>
            )}

            {state.isLoading && (
              <div className="flex flex-col items-center justify-center py-40 space-y-6 animate-in">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Investigando registros...</p>
              </div>
            )}

            {state.error && !state.isLoading && (
              <div className="py-20 text-center space-y-6 animate-in">
                <p className="text-slate-500 text-sm italic">"{state.error}"</p>
                <button onClick={() => handleSearch('')} className="text-xs font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-6 py-2 rounded-full">Volver</button>
              </div>
            )}

            {state.definition && !state.isLoading && (
              <div className="animate-in">
                <DefinitionCard data={state.definition} theme={theme} />
              </div>
            )}
          </div>
        </main>

        <footer className={`py-12 px-6 border-t ${isDark ? 'border-slate-900 text-slate-700' : 'border-slate-100 text-slate-300'}`}>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">LexiPedia © 2024</span>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
              <span>Privacidad</span>
              <span>Términos</span>
              <span>Contacto</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
