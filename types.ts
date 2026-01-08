export interface Cie10Code {
  code: string;
  description: string;
  active: boolean;
}

export interface CupsCode {
  code: string;
  description: string;
  category: 'Diagnostic' | 'Therapeutic' | 'Surgical';
  active: boolean;
  soatCode?: string;
}

export interface UserProfile {
  name: string;
  role: string;
  specialty: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  // Optional fields as per requirement
  weight?: string;
  height?: string;
  personalHistory?: string;
  familyHistory?: string;
  otherInfo?: string;
  createdAt: string;
}

export interface ClinicalEvolution {
  id: string;
  date: string;
  professionalName: string;
  professionalSpecialty: string;
  originalText: string;
  analysis: AIAnalysisResult;
}

export interface Case {
  id: string;
  patientId: string;
  status: 'Active' | 'Closed';
  createdAt: string;
  evolutions: ClinicalEvolution[];
}

export interface ConsultationHistory {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  category?: string;
}

// AI Response Structures
export interface SuggestedDiagnosis {
  code: string;
  description: string;
  probability: 'High' | 'Medium' | 'Low';
  justification: string;
}

export interface SuggestedProcedure {
  cups: string;
  soat?: string;
  description: string;
  justification: string;
}

export interface AIAnalysisResult {
  correctedText: string;
  summary: string;
  diagnostics: SuggestedDiagnosis[];
  procedures: SuggestedProcedure[];
  plan: string;
  alerts: string[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CASES = 'CASES',
  CONSULTANT = 'CONSULTANT',
  ADMIN = 'ADMIN',
  SETTINGS = 'SETTINGS'
}

export interface MedicalDatabase {
  cie10: Cie10Code[];
  cups: CupsCode[];
}
