
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
    Analise este histórico de níveis (0, 25, 50, 75, 100%):
    ${JSON.stringify(history.slice(0, 30))}
    
    CRITÉRIOS DE ERRO:
    1. Queda rápida de nível (ex: de 100 para 50 em pouco tempo) = POSSÍVEL VAZAMENTO.
    2. Nível parado em 0% ou 25% por muito tempo = FALHA NA BOMBA OU FALTA DE ÁGUA DA RUA.
    3. Oscilações incoerentes = SENSOR COM DEFEITO.

    Se encontrar um problema, inicie a frase com "ANOMALIA DETECTADA:" em letras maiúsculas e descreva o erro de forma alarmante.
    Se estiver tudo bem, diga "SISTEMA OPERANDO NORMALMENTE" e elogie a estabilidade.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao processar telemetria.";
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
