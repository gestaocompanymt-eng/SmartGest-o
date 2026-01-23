
import { GoogleGenAI } from "@google/genai";
import { Equipment } from "./types";

// Função auxiliar para obter a chave de forma segura
const getApiKey = () => {
  try {
    return typeof process !== 'undefined' ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

/**
 * Analisa os dados técnicos de um equipamento para identificar riscos.
 */
export const analyzeEquipmentState = async (equipment: Equipment) => {
  const apiKey = getApiKey();
  if (!apiKey) return "Análise indisponível: API Key não configurada.";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analise os seguintes dados técnicos de um equipamento de condomínio e forneça um breve parecer técnico (máx 3 frases):
    Tipo: ${equipment.typeId}
    Corrente Nominal: ${equipment.nominalCurrent}A
    Corrente Medida: ${equipment.measuredCurrent}A
    Temperatura: ${equipment.temperature}°C
    Ruído: ${equipment.noise}
    Estado Elétrico: ${equipment.electricalState}
    
    Identifique riscos potenciais de quebra ou necessidade de manutenção imediata.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    return "Não foi possível realizar a análise automática no momento.";
  }
};

/**
 * Gera um resumo executivo do status técnico de um condomínio.
 */
export const generateTechnicalSummary = async (condoName: string, recentOS: any[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return "Resumo indisponível.";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Resuma o status técnico do condomínio ${condoName} baseado nas últimas ordens de serviço:
    ${JSON.stringify(recentOS)}
    Escreva um parágrafo executivo para o síndico destacando a saúde dos sistemas.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Resumo indisponível.";
  }
};
