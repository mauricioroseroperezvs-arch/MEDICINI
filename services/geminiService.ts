import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { MedicalDatabase, UserProfile } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the Clinical Analysis Response
const analysisSchema: SchemaParams = {
  type: Type.OBJECT,
  properties: {
    correctedText: { type: Type.STRING, description: "The clinical note corrected for grammar, spelling, and professional medical terminology (Spanish). Format: Formal medical record style." },
    summary: { type: Type.STRING, description: "A concise summary of the patient's current evolution." },
    diagnostics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "The CIE-10 code EXACTLY as found in the provided database context." },
          description: { type: Type.STRING, description: "The official description." },
          probability: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          justification: { type: Type.STRING, description: "Clinical reasoning for this diagnosis." },
        },
        required: ["code", "description", "probability", "justification"]
      }
    },
    procedures: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cups: { type: Type.STRING, description: "The CUPS code EXACTLY as found in the provided database context." },
          soat: { type: Type.STRING, description: "The SOAT code if available." },
          description: { type: Type.STRING },
          justification: { type: Type.STRING, description: "Medical necessity for this procedure." },
        },
        required: ["cups", "description", "justification"]
      }
    },
    plan: { type: Type.STRING, description: "Detailed clinical management plan (conducta), including medications, exams, or referrals." },
    alerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Clinical red flags or administrative warnings." },
  },
  required: ["correctedText", "summary", "diagnostics", "procedures", "plan", "alerts"]
};

export const analyzeClinicalNote = async (
  note: string,
  patientContext: string,
  previousEvolutions: string,
  db: MedicalDatabase,
  profile: UserProfile
) => {
  if (!apiKey) throw new Error("API Key missing");

  // Construct the prompt with the "Controlled Database"
  const cie10List = db.cie10.filter(c => c.active).map(c => `${c.code}: ${c.description}`).join('\n');
  const cupsList = db.cups.filter(c => c.active).map(c => `${c.code} (SOAT: ${c.soatCode || 'N/A'}): ${c.description}`).join('\n');

  const prompt = `
    ROL: Actúa como un Asistente Médico Experto para un profesional con el rol de "${profile.role}" y especialidad en "${profile.specialty}".
    
    TAREA: Analizar una nueva evolución clínica y estructurar la salida.

    CONTEXTO DEL PACIENTE:
    ${patientContext}

    HISTORIA PREVIA (RESUMEN):
    ${previousEvolutions || "Primera atención."}

    NUEVA NOTA CLÍNICA (TEXTO LIBRE):
    "${note}"

    REGLAS DE SEGURIDAD (ANTI-ALUCINACIÓN):
    1. DIAGNÓSTICOS: Solo sugiere códigos CIE-10 que estén en la LISTA AUTORIZADA abajo. Si el paciente tiene algo que no está en la lista, menciónalo en "alerts" pero no inventes el código.
    2. PROCEDIMIENTOS: Solo sugiere códigos CUPS que estén en la LISTA AUTORIZADA abajo.
    3. TONO: Usa terminología médica formal, adaptada a la especialidad de ${profile.specialty}.
    4. NO INVENTAR: Si falta información, indícalo.

    LISTA CIE-10 AUTORIZADA:
    ${cie10List}

    LISTA CUPS AUTORIZADA:
    ${cupsList}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        systemInstruction: `Eres un asistente clínico estricto. Tu prioridad es la seguridad del paciente y la trazabilidad documental bajo normativa colombiana. Eres especialista en ${profile.specialty}.`,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const consultMedicalBase = async (query: string, db: MedicalDatabase, profile: UserProfile) => {
     if (!apiKey) throw new Error("API Key missing");
     
     const cie10List = db.cie10.filter(c => c.active).map(c => `${c.code}: ${c.description}`).join('\n');
     const cupsList = db.cups.filter(c => c.active).map(c => `${c.code}: ${c.description}`).join('\n');
     
     const prompt = `
        Pregunta del médico (${profile.specialty}): "${query}"
        
        Responde basándote EXCLUSIVAMENTE en las siguientes bases de datos autorizadas:
        
        CIE-10:
        ${cie10List}

        CUPS:
        ${cupsList}
        
        Instrucciones:
        1. Si la respuesta implica un código, debe estar en la lista.
        2. Provee una explicación clínica breve si es relevante.
        3. Si no encuentras el concepto en la lista, di: "No se encontró información en la base de datos controlada."
     `;

     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
     });

     return response.text;
}
