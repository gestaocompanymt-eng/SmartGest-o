
import { GoogleGenAI } from "@google/genai";
import { Equipment } from "./types";

/**
 * Analisa os dados técnicos de um equipamento para identificar riscos.
 */
export const analyzeEquipmentState = async (equipment: Equipment) => {
  // Fix: Direct initialization using process.env.API_KEY as per the required coding guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Fix: Property names updated to match the Equipment interface (snake_case)
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
    // Fix: Using property .text directly as per SDK requirements
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
  // Fix: Direct initialization using process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Resuma o status técnico do condomínio ${condoName} baseado nas últimas ordens de serviço:
    ${JSON.stringify(recentOS)}
    Escreva um parágrafo executivo para o síndico destacando a saúde dos sistemas.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Using property .text directly
    return response.text;
  } catch (error) {
    console.error("Erro no resumo Gemini:", error);
    return "Resumo indisponível.";
  }
};
