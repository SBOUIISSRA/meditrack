export interface Entity { id: string; }
export type MetricType = 'poids' | 'taille' | 'tension' | 'pouls' | 'glycemie';
export interface Measure extends Entity { type: MetricType; date: string; value: number; value2?: number; } // value2 = diastolique
export interface Consultation extends Entity { doctor: string; specialty: string; date: string; reason: string; notes: string; }
export interface Medication extends Entity { name: string; dose: string; frequency: string; start: string; end?: string; status: 'active' | 'completed'; }
export interface Appointment extends Entity { doctor: string; specialty: string; datetime: string; cancelled?: boolean; notes?: string; }
export interface Analysis extends Entity { name: string; date: string; value: number; unit: string; refMin?: number; refMax?: number; lab?: string; }
export interface MedDocument extends Entity { title: string; category: string; date: string; dataUrl: string; linkedTo?: string; }
export interface Profile { fullName: string; birthDate: string; bloodGroup?: string; allergies: string[]; history: string[]; chronic: string[]; surgeries: string[]; }
export const METRICS: Record<MetricType, { label: string; unit: string; min?: number; max?: number }> = {
  poids: { label: 'Poids', unit: 'kg' }, taille: { label: 'Taille', unit: 'cm' },
  tension: { label: 'Tension (sys/dia)', unit: 'mmHg', min: 90, max: 140 },
  pouls: { label: 'Fréquence cardiaque', unit: 'bpm', min: 60, max: 100 },
  glycemie: { label: 'Glycémie à jeun', unit: 'g/L', min: 0.7, max: 1.1 },
};