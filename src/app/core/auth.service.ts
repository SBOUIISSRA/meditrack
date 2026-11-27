import { Injectable, signal } from '@angular/core';
export interface User { name: string; email: string; }
interface Stored extends User { hash: string; }
const read = <T>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } };
/** Authentification locale (démo) : comptes stockés dans ce navigateur, aucun serveur. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(read<User | null>('mt2_session', null));
  private async hash(p: string) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch { return btoa(encodeURIComponent(p)); }
  }
  /** Retourne un message d'erreur, ou null si tout s'est bien passé. */
  async signUp(name: string, email: string, password: string): Promise<string | null> {
    const users = read<Stored[]>('mt2_users', []), e = email.trim().toLowerCase();
    if (users.some(u => u.email === e)) return 'Un compte existe déjà avec cet e-mail.';
    users.push({ name: name.trim(), email: e, hash: await this.hash(password) });
    localStorage.setItem('mt2_users', JSON.stringify(users));
    this.start({ name: name.trim(), email: e }); return null;
  }
  async signIn(email: string, password: string): Promise<string | null> {
    const e = email.trim().toLowerCase(), u = read<Stored[]>('mt2_users', []).find(x => x.email === e);
    if (!u || u.hash !== await this.hash(password)) return 'E-mail ou mot de passe incorrect.';
    this.start({ name: u.name, email: u.email }); return null;
  }
  signOut() { this.user.set(null); localStorage.removeItem('mt2_session'); }
  private start(u: User) { this.user.set(u); localStorage.setItem('mt2_session', JSON.stringify(u)); }
}
