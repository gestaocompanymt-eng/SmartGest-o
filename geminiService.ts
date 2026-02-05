
import { GoogleGenAI } from "@google/genai";
import { Equipment, WaterLevel } from "./types";

export const analyzeEquipmentState = async (equipment: Equipment) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise tecnicamente:
    Tipo: ${equipment.type_id}
    Corrente: ${equipment.measured_current}A (Nominal: ${equipment.nominal_current}A)
    Temperatura: ${equipment.temperature}°C
    Ruído: ${equipment.noise}
    Estado: ${equipment.electrical_state}
    Identifique riscos de quebra.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Falha na análise técnica.";
  }
};

export const analyzeWaterLevelHistory = async (history: WaterLevel[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Aja como um Engenheiro Especialista em Hidráulica Predial.
    Analise este histórico de níveis discretos (0, 25, 50, 75, 100%) obtidos por eletrodos:
    ${JSON.stringify(history.slice(0, 30))}
    
    CRITÉRIOS DE ANÁLISE:
    1. Se o nível cair de 100% para 50% muito rápido, pode ser consumo excessivo ou vazamento.
    2. Se o nível ficar em 0% por mais de 2 leituras, a bomba pode ter falhado ou falta água da rua.
    3. Se o nível oscilar loucamente (ex: 100 -> 0 -> 100), um eletrodo pode estar oxidado ou solto.

    IMPORTANTE: Se detectar falha, comece com "ANOMALIA DETECTADA:". Caso contrário, "SISTEMA OPERANDO NORMALMENTE".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao processar telemetria da IA.";
  }
};

export const generateTechnicalSummary = async (condoName: string, recentOS: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Resuma o status técnico de ${condoName}: ${JSON.stringify(recentOS)}`;
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
