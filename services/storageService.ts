import { Patient, Case, MedicalDatabase, UserProfile, ConsultationHistory } from '../types';
import { SEED_CIE10, SEED_CUPS } from '../constants';

const KEYS = {
  PATIENTS: 'medicinia_patients',
  CASES: 'medicinia_cases',
  DB: 'medicinia_db',
  PROFILE: 'medicinia_profile',
  CONSULT_HISTORY: 'medicinia_consult_history'
};

export const storageService = {
  // Patients
  getPatients: (): Patient[] => {
    const data = localStorage.getItem(KEYS.PATIENTS);
    return data ? JSON.parse(data) : [];
  },
  savePatient: (patient: Patient) => {
    const patients = storageService.getPatients();
    const updated = [...patients, patient];
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
    return updated;
  },

  // Cases
  getCases: (): Case[] => {
    const data = localStorage.getItem(KEYS.CASES);
    return data ? JSON.parse(data) : [];
  },
  saveCase: (medicalCase: Case) => {
    const cases = storageService.getCases();
    const existingIndex = cases.findIndex(c => c.id === medicalCase.id);
    let updated;
    if (existingIndex >= 0) {
        updated = [...cases];
        updated[existingIndex] = medicalCase;
    } else {
        updated = [...cases, medicalCase];
    }
    localStorage.setItem(KEYS.CASES, JSON.stringify(updated));
    return updated;
  },
  getCaseByPatientId: (patientId: string): Case | undefined => {
      const cases = storageService.getCases();
      return cases.find(c => c.patientId === patientId);
  },

  // Database (Admin)
  getDatabase: (): MedicalDatabase => {
    const data = localStorage.getItem(KEYS.DB);
    if (data) return JSON.parse(data);
    
    // Initial Seed
    const initialDb: MedicalDatabase = { cie10: SEED_CIE10, cups: SEED_CUPS };
    localStorage.setItem(KEYS.DB, JSON.stringify(initialDb));
    return initialDb;
  },
  saveDatabase: (db: MedicalDatabase) => {
    localStorage.setItem(KEYS.DB, JSON.stringify(db));
    return db;
  },

  // User Profile
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : { name: 'Dr. Usuario', role: 'Médico', specialty: 'Medicina General' };
  },
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    return profile;
  },

  // Consultant History
  getConsultHistory: (): ConsultationHistory[] => {
    const data = localStorage.getItem(KEYS.CONSULT_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  saveConsultQuery: (item: ConsultationHistory) => {
    const history = storageService.getConsultHistory();
    const updated = [item, ...history]; // Newest first
    localStorage.setItem(KEYS.CONSULT_HISTORY, JSON.stringify(updated));
    return updated;
  }
};
