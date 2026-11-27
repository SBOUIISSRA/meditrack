import { Injectable, inject, signal } from '@angular/core';
import { DataService } from './data.service';
export interface Alert { key: string; text: string; }
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private data = inject(DataService);
  alerts = signal<Alert[]>([]);
  private dismissed = new Set<string>(JSON.parse(localStorage.getItem('mt_dismissed') ?? '[]'));
  constructor() { this.check(); setInterval(() => this.check(), 30_000); }
  dismiss(key: string) { this.dismissed.add(key); localStorage.setItem('mt_dismissed', JSON.stringify([...this.dismissed])); this.check(); }
  private check() {
    const now = Date.now(), out: Alert[] = [];
    for (const a of this.data.appointments.items()) {
      const diff = new Date(a.datetime).getTime() - now;
      if (!a.cancelled && diff > 0 && diff < 24 * 3600e3)
        out.push({ key: 'a' + a.id, text: `Rendez-vous ${diff < 3600e3 ? 'imminent' : 'dans moins de 24 h'} : Dr ${a.doctor} (${a.specialty}) à ${new Date(a.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` });
    }
    const today = new Date().toISOString().slice(0, 10);
    for (const m of this.data.medications.items())
      if (m.start <= today && (!m.end || m.end >= today))
        out.push({ key: `m${m.id}${today}`, text: `Rappel : prendre ${m.name} (${m.dose}, ${m.frequency})` });
    this.alerts.set(out.filter(a => !this.dismissed.has(a.key)));
  }
}
