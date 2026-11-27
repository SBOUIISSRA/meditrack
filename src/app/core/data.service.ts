import { Injectable, signal } from '@angular/core';
import { Collection } from './collection';
import { Analysis, Appointment, Consultation, MedDocument, Measure, Medication, Profile } from './models';
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const when = (n: number, t: string) => `${day(n)}T${t}`;
@Injectable({ providedIn: 'root' })
export class DataService {
  consultations = new Collection<Consultation>('mt2_consults', [
    { doctor: 'Karim Ben Salah', specialty: 'Cardiologie', date: day(-40), reason: 'Contrôle annuel', notes: 'Tension stable.' },
    { doctor: 'Amel Trabelsi', specialty: 'Médecine générale', date: day(-12), reason: 'Fatigue persistante', notes: 'Bilan sanguin prescrit.' },
    { doctor: 'Sami Jebali', specialty: 'Dermatologie', date: day(-3), reason: 'Irritation cutanée', notes: '' },
  ]);
  measures = new Collection<Measure>('mt2_measures', [
    ...[[-30, 78.4, 128, 82], [-21, 77.9, 125, 80], [-14, 77.2, 131, 84], [-7, 76.8, 122, 79], [-1, 76.5, 120, 78]]
      .flatMap(([d, w, s, p]) => [{ type: 'poids' as const, date: day(d), value: w }, { type: 'tension' as const, date: day(d), value: s, value2: p }]),
  ]);
  medications = new Collection<Medication>('mt2_meds', [
    { name: 'Amlodipine', dose: '5 mg', frequency: '1 fois par jour, le matin', start: day(-60), status: 'active' },
    { name: 'Vitamine D', dose: '1000 UI', frequency: '1 fois par jour', start: day(-20), status: 'active' },
    { name: 'Amoxicilline', dose: '500 mg', frequency: '3 fois par jour', start: day(-90), end: day(-83), status: 'completed' },
  ]);
  appointments = new Collection<Appointment>('mt2_appts', [
    { doctor: 'Karim Ben Salah', specialty: 'Cardiologie', datetime: when(4, '09:30') },
    { doctor: 'Amel Trabelsi', specialty: 'Médecine générale', datetime: when(11, '15:00') },
  ]);
  analyses = new Collection<Analysis>('mt2_analyses', [{ name: 'Glycémie', date: day(-10), value: 0.94, unit: 'g/L', refMin: 0.7, refMax: 1.1 }]);
  documents = new Collection<MedDocument>('mt2_docs');
  theme = signal<'light' | 'dark'>((localStorage.getItem('mt2_theme') as 'light' | 'dark') ?? 'light');
  toggleTheme() { const t = this.theme() === 'light' ? 'dark' : 'light'; this.theme.set(t); localStorage.setItem('mt2_theme', t); }
  profile = signal<Profile>(JSON.parse(localStorage.getItem('mt2_profile') ?? 'null') ??
    { fullName: '', birthDate: '', allergies: [], history: [], chronic: [], surgeries: [] });
  saveProfile(p: Profile) { this.profile.set(p); localStorage.setItem('mt2_profile', JSON.stringify(p)); }
}
