import { signal } from '@angular/core';
import { Entity } from './models';
export class Collection<T extends Entity> {
  readonly items = signal<T[]>([]);
  constructor(private key: string, seed: Omit<T, 'id'>[] = []) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { this.items.set(seed.map(s => ({ ...s, id: crypto.randomUUID() }) as T)); this.save(); }
      else { const d = JSON.parse(raw); this.items.set(Array.isArray(d) ? d : []); }
    } catch { this.items.set([]); }
  }
  private save() { try { localStorage.setItem(this.key, JSON.stringify(this.items())); } catch { /* stockage plein ou indisponible */ } }
  add(i: Omit<T, 'id'>) { this.items.update(l => [...l, { ...i, id: crypto.randomUUID() } as T]); this.save(); }
  update(id: string, patch: Partial<T>) { this.items.update(l => l.map(x => x.id === id ? { ...x, ...patch } : x)); this.save(); }
  remove(id: string) { this.items.update(l => l.filter(x => x.id !== id)); this.save(); }
}
