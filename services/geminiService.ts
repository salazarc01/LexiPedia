
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
  const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera contenido para la portada de una enciclopedia universal para el día ${dateStr}.`,
      config: {
        systemInstruction: `Eres el editor jefe de LexiPedia, un portal de investigación universal.
        Tu tarea es generar contenido cultural, científico e histórico veraz y fascinante.
        Reglas de estilo:
        - Tono enciclopédico, serio y profesional.
        - No menciones el uso de inteligencia artificial.
        - Evita frases de relleno.
        
        Debes proporcionar en formato JSON:
        1. 'featuredArticle': Un tema profundo de interés general.
        2. 'resourceOfDay': Una herramienta conceptual o técnica útil.
        3. 'onThisDay': 3 hitos históricos ocurridos un día como hoy.`,
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
      featuredArticle: { title: "El Legado de la Cartografía", summary: "Desde los primeros mapas grabados en arcilla hasta los complejos sistemas modernos, la cartografía ha sido esencial para entender nuestra posición en el cosmos." },
      resourceOfDay: { title: "Método Dialéctico", description: "Proceso de investigación que busca la verdad a través del contraste de ideas opuestas." },
      onThisDay: ["Se inaugura la red de conocimiento LexiPedia", "Hoy se celebra la curiosidad intelectual", "El acceso a la información se considera un pilar de la libertad"]
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
      contents: `Proporciona una investigación exhaustiva y enciclopédica sobre: "${word}".`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: `Eres el motor de investigación de LexiPedia. Genera artículos profesionales, estructurados y precisos.
        - No menciones que eres una IA.
        - No menciones actualizaciones automáticas.
        - Proporciona etimología, fonética (si aplica) y ejemplos de uso.
        - Formato obligatorio: JSON.`,
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
    throw new Error("El término consultado no se encuentra en los registros actuales o la investigación ha sido interrumpida.");
  }
};
