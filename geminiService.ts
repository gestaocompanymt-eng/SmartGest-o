
import { GoogleGenAI } from "@google/genai";
import { Equipment, MonitoringAlert } from "./types";

/**
 * Analisa tecnicamente o estado do equipamento e identifique riscos de falha catastrófica.
 */
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

/**
 * Diagnostica um alerta de monitoramento Tuya utilizando IA generativa para identificar causas prováveis.
 */
export const diagnoseMonitoringAlert = async (alert: MonitoringAlert, equipment: Equipment) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Você é um engenheiro sênior de manutenção predial e especialista em IoT industrial. 
    Diagnostique tecnicamente este alerta de telemetria em tempo real:
    
    Equipamento: ${equipment.manufacturer} ${equipment.model} (Tipo ID: ${equipment.type_id})
    Alerta Recebido: ${alert.message}
    Valor do Gatilho: ${alert.value}
    Contexto do Ativo: Corrente ${equipment.measured_current}A, Temp ${equipment.temperature}°C, Status ${equipment.monitoring_status}
    Últimas Leituras: ${JSON.stringify(equipment.last_reading)}
    
    Explique de forma extremamente concisa a causa provável e sugira a ação técnica corretiva imediata.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro no diagnóstico IA:", error);
    return "Ocorreu um erro ao processar o diagnóstico inteligente.";
  }
};
