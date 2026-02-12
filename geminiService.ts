
import { GoogleGenAI } from "@google/genai";
import { Equipment, WaterLevel, MonitoringAlert } from "./types";

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

export const diagnoseMonitoringAlert = async (alert: MonitoringAlert, equipment: Equipment) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Aja como um Engenheiro Especialista em Manutenção Predial e IOT.
    Diagnostique a causa raiz deste alerta de monitoramento Tuya Cloud:
    Equipamento: ${equipment.manufacturer} ${equipment.model}
    Tipo: ${equipment.type_id}
    Localização: ${equipment.location}
    Mensagem de Erro: ${alert.message}
    Valor IOT Lido: ${alert.value}
    
    Forneça:
    1. Causa Raiz Provável.
    2. Risco para a Operação.
    3. Recomendação Técnica Imediata.
    
    Seja direto e use termos de engenharia.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao processar diagnóstico inteligente.";
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
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erro ao processar diagnóstico IOT.";
  }
};
