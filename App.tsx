
import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import DefinitionCard from './components/DefinitionCard';
import { getDefinition, getHomeContent } from './services/geminiService';
import { AppState, UserMeta } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lexipedia-theme');
    // Forzamos el inicio en modo claro por defecto.
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
      location: 'Detectando...',
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        userMeta: { ...prev.userMeta, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const content = await getHomeContent();
        setState(prev => ({ ...prev, homeContent: content }));
      } catch (e) {
        console.error("Error cargando portada");
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            setState(prev => ({
              ...prev,
              userMeta: { ...prev.userMeta, location: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°` }
            }));
          },
          () => setState(prev => ({ ...prev, userMeta: { ...prev.userMeta, location: 'Ubicación desactivada' } }))
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
        history: [query, ...prev.history.filter(h => h !== query)].slice(0, 8)
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'La investigación no arrojó resultados concluyentes.'
      }));
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex transition-colors duration-500 selection:bg-indigo-500/30 ${
      isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Modern Wikipedia Style */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-r ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleSearch('')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">L</div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">LexiPedia</h1>
                <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">Portal Universal</p>
              </div>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            <button 
              onClick={() => handleSearch('')}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 mb-6 ${!state.definition ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : (isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="font-semibold text-sm">Página Principal</span>
            </button>
            
            <div className={`pt-2 pb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Investigaciones Recientes</div>
            {state.history.map((h, i) => (
              <button 
                key={i} 
                onClick={() => handleSearch(h)}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors truncate text-sm flex items-center gap-3 ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="truncate">{h}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <button onClick={toggleTheme} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm border font-bold ${isDark ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-300' : 'bg-slate-100 border-slate-200 hover:border-indigo-400 text-slate-700'}`}>
              <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
              <span>{isDark ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className={`sticky top-0 z-40 p-3 md:p-4 border-b backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-200'}`}>
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <button 
              className={`p-2.5 rounded-xl md:hidden transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`} 
              onClick={() => setIsSidebarOpen(true)}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} isLoading={state.isLoading} theme={theme} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-10 relative">
          <div className="max-w-5xl mx-auto">
            
            {/* PORTADA */}
            {!state.definition && !state.isLoading && !state.error && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Hero Banner */}
                <div className={`p-8 md:p-12 rounded-[2.5rem] border relative overflow-hidden group ${isDark ? 'bg-indigo-950/10 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'}`}>
                   <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                      <div className="flex-1">
                        <h2 className="text-3xl md:text-5xl font-bold serif mb-4 leading-tight">Conocimiento universal al alcance de tu mano</h2>
                        <p className={`text-base md:text-lg max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Bienvenido a LexiPedia. Investiga términos, descubre historia y explora el conocimiento global con nuestra base de datos verificada y actualizada.
                        </p>
                      </div>
                      <div className={`flex flex-col items-end font-mono text-right justify-between pt-6 md:pt-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <div className="space-y-1">
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-60">Cronómetro Global</p>
                          <p className="text-xl md:text-3xl font-black">{state.userMeta.time}</p>
                        </div>
                        <div className="mt-4 md:mt-0 text-[10px] md:text-xs font-bold bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-500/20 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          {state.userMeta.location}
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Destacado Main */}
                  <div className="md:col-span-2">
                    <section className={`p-8 md:p-10 rounded-[2.5rem] border shadow-2xl h-full transition-all hover:shadow-indigo-500/5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2l5.256.764a1 1 0 01.554 1.705l-3.803 3.707.898 5.234a1 1 0 01-1.451 1.054L11 17.147l-4.7 2.471a1 1 0 01-1.451-1.054l.898-5.234-3.803-3.707a1 1 0 01.554-1.705l5.256-.764 1.212-4.456A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Lectura del Día</h3>
                      </div>
                      {state.homeContent ? (
                        <div className="space-y-6">
                          <h4 className="text-3xl md:text-5xl font-bold serif leading-tight tracking-tight">{state.homeContent.featuredArticle.title}</h4>
                          <p className={`text-lg md:text-xl leading-relaxed font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {state.homeContent.featuredArticle.summary}
                          </p>
                          <button 
                            onClick={() => handleSearch(state.homeContent?.featuredArticle.title || '')}
                            className="inline-flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
                          >
                            Investigar artículo <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-6">
                           <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/4"></div>
                           <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Secondary Columns */}
                  <div className="space-y-8">
                    <section className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-emerald-500">Recurso Semanal</h3>
                      {state.homeContent ? (
                        <div className="space-y-3">
                          <h4 className="text-xl font-bold tracking-tight">{state.homeContent.resourceOfDay.title}</h4>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {state.homeContent.resourceOfDay.description}
                          </p>
                        </div>
                      ) : <div className="animate-pulse h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>}
                    </section>

                    <section className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-amber-500">Historia Reciente</h3>
                      {state.homeContent ? (
                        <ul className="space-y-5">
                          {state.homeContent.onThisDay.map((event, i) => (
                            <li key={i} className="text-sm flex gap-4 leading-relaxed group cursor-default">
                              <span className="text-amber-500 font-bold shrink-0 transition-transform group-hover:scale-125">★</span>
                              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{event}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>}
                    </section>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Investigation */}
            {state.isLoading && (
              <div className="flex flex-col items-center justify-center py-20 md:py-40 space-y-8">
                <div className="relative">
                  <div className={`w-20 h-20 md:w-24 md:h-24 border-2 rounded-full animate-spin border-transparent ${
                    isDark ? 'border-t-indigo-500' : 'border-t-indigo-600'
                  }`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold serif italic">LexiPedia Procesando</h3>
                  <p className={`text-sm font-medium tracking-widest uppercase opacity-40 animate-pulse-slow`}>Consultando fuentes universales...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {state.error && !state.isLoading && (
              <div className={`p-8 md:p-16 rounded-[3rem] border text-center space-y-6 max-w-xl mx-auto shadow-2xl ${
                isDark ? 'bg-red-950/20 border-red-900/40 text-red-400' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold serif">Búsqueda Fallida</h4>
                  <p className="text-sm opacity-80 leading-relaxed">{state.error}</p>
                </div>
                <button onClick={() => handleSearch('')} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 transition-all">Regresar a Portada</button>
              </div>
            )}

            {/* Result Card */}
            {state.definition && !state.isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <DefinitionCard data={state.definition} theme={theme} />
              </div>
            )}
          </div>
        </main>

        <footer className={`py-12 px-8 border-t ${isDark ? 'border-slate-900 bg-slate-950 text-slate-600' : 'border-slate-200 bg-white text-slate-400'}`}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[10px] font-black">L</div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-900 dark:text-white">LexiPedia Dictionary</span>
              </div>
              <p className="text-[9px] font-medium opacity-50 tracking-wider">Investigación profesional verificada • 2024</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-[0.2em]">
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Normativa de Privacidad</span>
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Condiciones Legales</span>
              <span className="cursor-pointer hover:text-indigo-500 transition-colors">Contacto Editorial</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
