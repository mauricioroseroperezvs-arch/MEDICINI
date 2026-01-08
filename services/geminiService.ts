import { GoogleGenerativeAI, SchemaType } from "@google/genai";
import { MedicalDatabase, UserProfile } from "../types";

// ⚠️ Vite usa import.meta.env, NO process.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(apiKey);

// =========================
// Response Schema
// =========================
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    correctedText: {
      type: SchemaType.STRING,
      description:
        "Nota clínica corregida en español médico formal."
    },
    summary: {
      type: SchemaType.STRING,
      description:
        "Resumen conciso de la evolución actual del paciente."
    },
    diagnostics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          code: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          probability: {
            type: SchemaType.STRING,
            enum: ["High", "Medium", "Low"]
          },
          justification: { type: SchemaType.STRING }
        },
        required: ["code", "description", "probability", "justification"]
      }
    },
    procedures: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          cups: { type: SchemaType.STRING },
          soat: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          justification: { type: SchemaType.STRING }
        },
        required: ["cups", "description", "justification"]
      }
    },
    plan: {
      type: SchemaType.STRING,
      description: "Plan de manejo clínico detallado."
    },
    alerts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: [
    "correctedText",
    "summary",
    "diagnostics",
    "procedures",
    "plan",
    "alerts"
  ]
};

// =========================
// Analyze Clinical Note
// =========================
export async function analyzeClinicalNote(
  note: string,
  patientContext: string,
  previousEvolutions: string,
  db: MedicalDatabase,
  profile: UserProfile
) {
  const cie10List = db.cie10
    .filter(c => c.active)
    .map(c => `${c.code}: ${c.description}`)
    .join("\n");

  const cupsList = db.cups
    .filter(c => c.active)
    .map(
      c =>
        `${c.code} (SOAT: ${c.soatCode ?? "N/A"}): ${c.description}`
    )
    .join("\n");

  const prompt = `
ROL: Asistente médico experto para ${profile.role}, especialidad ${profile.specialty}.

CONTEXTO DEL PACIENTE:
${patientContext}

HISTORIA PREVIA:
${previousEvolutions || "Primera atención."}

NOTA CLÍNICA:
"${note}"

REGLAS:
- Solo usar códigos CIE-10 y CUPS listados.
- No inventar diagnósticos.
- Usar lenguaje médico formal.

CIE-10 AUTORIZADOS:
${cie10List}

CUPS AUTORIZADOS:
${cupsList}
`;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("Respuesta vacía del modelo");
  }

  return JSON.parse(text);
}

// =========================
// Consult Controlled Medical Base
// =========================
export async function consultMedicalBase(
  query: string,
  db: MedicalDatabase,
  profile: UserProfile
) {
  const cie10List = db.cie10
    .filter(c => c.active)
    .map(c => `${c.code}: ${c.description}`)
    .join("\n");

  const cupsList = db.cups
    .filter(c => c.active)
    .map(c => `${c.code}: ${c.description}`)
    .join("\n");

  const prompt = `
Pregunta (${profile.specialty}):
"${query}"

Responde SOLO con base en las listas siguientes.

CIE-10:
${cie10List}

CUPS:
${cupsList}

Si no hay información, responde:
"No se encontró información en la base de datos controlada."
`;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.2 }
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
