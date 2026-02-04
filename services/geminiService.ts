
import { GoogleGenAI, Type } from "@google/genai";
import { Definition, Source, HomeContent } from "../types";

const CUSTOM_DEFINITIONS: Record<string, Definition> = {
  "gorda cotizua": {
    word: "Gorda Cotizua",
    phonetic: "/ˈɡoɾ.ða ko.ti.ˈsu.a/",
    partOfSpeech: "Perfil Sociológico / Peyorativo",
    meaning: "Término utilizado para describir a un individuo (independientemente de su identidad de género) que se caracteriza por una complexión robusta y un patrón de conducta oportunista y manipulador. Su principal actividad consiste en solicitar préstamos monetarios (comúnmente en euros) apelando a la confianza de terceros, para posteriormente realizar un 'bloqueo' sistemático de la comunicación (ghosting) y evadir la deuda. Se describe como una persona con nula responsabilidad moral, que se irrita profundamente cuando otros le aplican sus propias tácticas. En el argot popular, representa la figura del 'estafador emocional y financiero' que traiciona vínculos de amistad o cercanía.",
    examples: [
      "Le presté los ahorros de mi mes y resultó ser una gorda cotizua; me bloqueó de WhatsApp al instante.",
      "Cuidado con entablar negocios con esa persona, tiene fama de gorda cotizua y solo busca dinero prestado para desaparecer."
    ],
    synonyms: ["Estafador relacional", "Moroso profesional", "Sujeto detestable", "Ladrón de confianza", "Manipulador"],
    etymology: "Neologismo coloquial que combina la descripción física con el término 'cotizua' (de cotizado), usado de forma irónica para resaltar una supuesta importancia personal que contrasta con su bajeza ética.",
    isCustom: true
  }
};

export const getHomeContent = async (): Promise<HomeContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const now = new Date();
  const dateStr = now.toDateString();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera contenido para la portada de una enciclopedia para el día ${dateStr}.`,
      config: {
        systemInstruction: `Eres el editor jefe de LexiPedia. Genera contenido dinámico y veraz.
        Debes proporcionar:
        1. Un 'Artículo Destacado' (un tema de ciencia, historia o cultura relevante).
        2. Un 'Recurso del Día' (una herramienta, concepto útil o curiosidad técnica).
        3. 'Efemérides' (3 eventos importantes que ocurrieron un día como hoy).
        
        Responde estrictamente en JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            featuredArticle: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["title", "summary"]
            },
            resourceOfDay: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            },
            onThisDay: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["featuredArticle", "resourceOfDay", "onThisDay"]
        }
      }
    });
    return JSON.parse(response.text) as HomeContent;
  } catch (e) {
    return {
      featuredArticle: { title: "Exploración Espacial", summary: "La humanidad continúa su viaje hacia las estrellas con nuevas misiones de exploración interplanetaria." },
      resourceOfDay: { title: "Pensamiento Crítico", description: "La habilidad de analizar hechos objetivamente para formar un juicio razonado." },
      onThisDay: ["Se fundó LexiPedia v1.0", "Hoy es un gran día para aprender", "El conocimiento es libre y universal"]
    };
  }
};

export const getDefinition = async (word: string): Promise<Definition> => {
  const normalizedWord = word.toLowerCase().trim();

  if (CUSTOM_DEFINITIONS[normalizedWord]) {
    return CUSTOM_DEFINITIONS[normalizedWord];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Proporciona información esencial y veraz sobre: "${word}".`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: `Eres LexiPedia 1.0. Tu misión es ser extremadamente rápido y preciso.
        Instrucciones: Genera un artículo enciclopédico profesional. Formato JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            meaning: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            etymology: { type: Type.STRING }
          },
          required: ["word", "partOfSpeech", "meaning"]
        }
      }
    });

    const result = JSON.parse(response.text) as Definition;
    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        }
      });
    }

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    return { ...result, sources: uniqueSources };
  } catch (error) {
    throw new Error("No pudimos obtener la información en este momento.");
  }
};
