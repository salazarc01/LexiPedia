
import React from 'react';
import { Definition } from '../types';

interface DefinitionCardProps {
  data: Definition;
  theme: 'light' | 'dark';
}

const DefinitionCard: React.FC<DefinitionCardProps> = ({ data, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border animate-in fade-in slide-in-from-bottom-6 duration-700 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header Estilo Enciclopedia */}
      <div className={`p-6 md:p-12 border-b ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
              {data.partOfSpeech}
            </span>
            {data.isCustom && (
              <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20">
                Alerta
              </span>
            )}
            {data.sources && data.sources.length > 0 && (
              <span className={`px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                Verificado
              </span>
            )}
          </div>
          <h2 className={`text-4xl md:text-7xl font-bold serif leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data.word}
          </h2>
          {data.phonetic && (
            <span className={`text-sm md:text-lg font-mono opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {data.phonetic}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-0 lg:divide-x divide-slate-800/10 dark:divide-slate-800">
        {/* Contenido Principal */}
        <div className="lg:col-span-2 p-6 md:p-12 space-y-10">
          <section>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Cuerpo de la Investigación
            </h3>
            <div className={`text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-light ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {data.meaning}
            </div>
          </section>

          {data.examples && data.examples.length > 0 && (
            <section className={`p-6 md:p-8 rounded-[2rem] border ${isDark ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Datos Recopilados
              </h3>
              <ul className="space-y-4 md:space-y-6">
                {data.examples.map((example, idx) => (
                  <li key={idx} className="flex gap-4 md:gap-6">
                    <span className="text-indigo-500 font-serif text-xl md:text-2xl opacity-50 shrink-0">•</span>
                    <p className={`italic leading-relaxed text-sm md:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {example}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.sources && data.sources.length > 0 && (
            <section className="pt-8 border-t border-dashed border-slate-800/20 dark:border-slate-800">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Fuentes Consultadas
              </h3>
              <div className="flex flex-col gap-3">
                {data.sources.slice(0, 5).map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-xs md:text-sm p-3 rounded-xl border transition-all flex items-center gap-3 ${isDark ? 'bg-slate-800/50 border-slate-800 text-indigo-400 hover:border-indigo-500' : 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Ficha Técnica */}
        <div className={`p-6 md:p-12 space-y-8 md:space-y-10 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
          {data.etymology && (
            <section>
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Contexto Histórico
              </h3>
              <p className={`text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {data.etymology}
              </p>
            </section>
          )}

          {data.synonyms && data.synonyms.length > 0 && (
            <section>
              <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Temas Relacionados
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.synonyms.map((syn, idx) => (
                  <span key={idx} className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold border transition-colors ${
                    isDark 
                      ? 'bg-slate-800 text-indigo-300 border-slate-700 hover:border-indigo-500' 
                      : 'bg-white text-indigo-600 border-slate-200 hover:border-indigo-400'
                  }`}>
                    {syn}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className={`pt-10 mt-10 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
             <p className={`text-[9px] uppercase tracking-widest leading-loose font-black ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
               LexiPedia Engine v1.0 • Verificación completa realizada satisfactoriamente.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefinitionCard;
