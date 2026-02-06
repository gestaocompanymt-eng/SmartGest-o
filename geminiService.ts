
import { GoogleGenAI } from "@google/genai";
import { Equipment, WaterLevel } from "./types";

export const analyzeEquipmentState = async (equipment: Equipment) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analise tecnicamente o estado do equipamento e identifique riscos de falha catastrófica:
    Tipo: ${equipment.type_id}
    Corrente Medida: ${equipment.measured_current}A (Nominal: ${equipment.nominal_current}A)
    Temperatura: ${equipment.temperature}°C
    Estado Visual/Elétrico: ${equipment.electrical_state}
    Ruído: ${equipment.noise}
    Seja conciso e técnico.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Análise temporariamente indisponível.";
  }
};

export const analyzeWaterLevelHistory = async (history: WaterLevel[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataSlice = history.slice(0, 30).map(l => ({ p: l.percentual, t: l.created_at }));
  
  const prompt = `Aja como um Engenheiro de Hidráulica. Analise a telemetria do reservatório:
    Dados: ${JSON.stringify(dataSlice)}
    
    Verifique:
    1. Quedas bruscas (vazamentos).
    2. Tempo de reposição (falha em bomba).
    3. Oscilações incoerentes (erro de sensor).
    
    Comece com "NORMAL" ou "ANOMALIA" em letras maiúsculas.`;

  try {
    const response = await ai.models.generateContent({
      // Fix: Updated model name to 'gemini-flash-lite-latest' as per alias guidelines
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao processar diagnóstico IOT.";
  }
};
