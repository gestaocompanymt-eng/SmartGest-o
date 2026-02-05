
import { GoogleGenAI } from "@google/genai";
import { Equipment, WaterLevel } from "./types";

/**
 * Analisa os dados técnicos de um equipamento para identificar riscos.
 */
export const analyzeEquipmentState = async (equipment: Equipment) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise os seguintes dados técnicos de um equipamento de condomínio e forneça um breve parecer técnico (máx 3 frases):
    Tipo: ${equipment.type_id}
    Corrente Nominal: ${equipment.nominal_current}A
    Corrente Medida: ${equipment.measured_current}A
    Temperatura: ${equipment.temperature}°C
    Ruído: ${equipment.noise}
    Estado Elétrico: ${equipment.electrical_state}
    
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
 * Realiza uma análise inteligente dos níveis de água para detectar vazamentos ou falhas de bomba.
 */
export const analyzeWaterLevelHistory = async (history: WaterLevel[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Como um engenheiro hidráulico, analise este histórico de leituras de nível de água (0 a 100%):
    ${JSON.stringify(history.slice(0, 20))}
    
    Verifique:
    1. Se há queda brusca (possível vazamento ou consumo excessivo).
    2. Se o nível não sobe (possível falha na bomba).
    3. Se o comportamento está normal.
    
    Responda de forma direta e destaque qualquer ANOMALIA em letras maiúsculas. Máximo 2 parágrafos.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao analisar dados hídricos.";
  }
};

/**
 * Gera um resumo executivo do status técnico de um condomínio.
 */
export const generateTechnicalSummary = async (condoName: string, recentOS: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    console.error("Erro no resumo Gemini:", error);
    return "Resumo indisponível.";
  }
};
