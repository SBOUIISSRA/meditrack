import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationService } from './core/notification.service';
import { DataService } from './core/data.service';
import { AuthService } from './core/auth.service';
import { AuthModalComponent } from './shared/auth-modal.component';
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, AuthModalComponent],
  template: `
  <header class="top">
    <button class="menu" aria-label="Menu" (click)="open.set(!open())">☰</button>
    <b class="logo"><span class="mark">✚</span>Medi<span>Track</span></b>

    <div class="sbox" (focusout)="onFocusOut($event)">
      <input class="in search" type="search" placeholder="Rechercher un médecin, un médicament ou une maladie…" aria-label="Recherche globale"
             [value]="q()" (input)="q.set($any($event.target).value); showRes.set(true)" (focus)="showRes.set(true)" (keydown.escape)="clear()">
      @if (results(); as r) {
        @if (showRes()) {
        <div class="drop">
          @if (!r.consults.length && !r.meds.length && !r.appts.length) { <p class="muted" style="margin:0">Aucun résultat pour « {{ q() }} ».</p> }
          @if (r.consults.length) { <h4>Consultations</h4>@for (c of r.consults; track c.id) { <a routerLink="/consultations" (click)="clear()">{{ c.date | date:'dd/MM/yyyy' }} · Dr {{ c.doctor }} · {{ c.reason }}</a> } }
          @if (r.meds.length) { <h4>Médicaments</h4>@for (m of r.meds; track m.id) { <a routerLink="/medicaments" (click)="clear()">{{ m.name }} · {{ m.dose }}</a> } }
          @if (r.appts.length) { <h4>Rendez-vous</h4>@for (a of r.appts; track a.id) { <span class="line">{{ a.datetime | date:'dd/MM/yyyy HH:mm' }} · Dr {{ a.doctor }} ({{ a.specialty }})</span> } }
        </div> }
      }
    </div>

    <div class="right">
      <span class="date">{{ today }}</span>
      @if (auth.user(); as u) {
        <span class="chip">👤 {{ u.name }}</span><button class="btn sm" (click)="auth.signOut()">Déconnexion</button>
      } @else {
        <button class="btn sm" (click)="openAuth('signup')">S'inscrire</button>
        <button class="btn sm" (click)="openAuth('signin')">Se connecter</button>
      }
      <button class="btn ghost sm" (click)="d.toggleTheme()" [attr.aria-label]="d.theme() === 'light' ? 'Mode sombre' : 'Mode clair'">{{ d.theme() === 'light' ? '🌙' : '☀️' }}</button>
    </div>
  </header>
  <div class="shell">
    <nav [class.open]="open()" (click)="open.set(false)">
      <a routerLink="/accueil" routerLinkActive="on">🏠 Tableau de bord</a>
      <a routerLink="/consultations" routerLinkActive="on">🩺 Consultations</a>
      <a routerLink="/medicaments" routerLinkActive="on">💊 Médicaments</a>
      <a routerLink="/suivi" routerLinkActive="on">📈 Suivi de santé</a>
      <div class="tip"><b>Votre santé, simplifiée</b><br>Gardez tout votre suivi médical au même endroit.</div>
    </nav>
    <main>
      @for (a of n.alerts(); track a.key) { <div class="alert" role="status"><span>{{ a.text }}</span> <button class="btn ghost sm" (click)="n.dismiss(a.key)">Masquer</button></div> }
      <router-outlet/>
    </main>
  </div>
  @if (authOpen()) { <app-auth-modal [(mode)]="authMode" (close)="authOpen.set(false)"/> }`,
  styles: [`
  .top{display:flex;align-items:center;gap:12px;padding:10px 20px;background:var(--card);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:20;box-shadow:0 2px 10px rgba(14,165,233,.08)}
  .logo{font:800 20px Manrope;color:var(--pri-d);display:flex;align-items:center;gap:8px;white-space:nowrap}.logo span{color:var(--pri)}
  .logo .mark{background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:16px}
  .sbox{position:relative;flex:1;max-width:480px;min-width:180px}
  .drop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--card);border:1px solid var(--bd);border-radius:12px;box-shadow:0 12px 30px rgba(2,132,199,.18);padding:10px 14px;max-height:60vh;overflow:auto;z-index:40}
  .drop h4{margin:8px 0 4px;font:700 12px Manrope;color:var(--mut);text-transform:uppercase;letter-spacing:.05em}
  .drop a,.drop .line{display:block;padding:5px 6px;border-radius:7px;color:var(--tx);text-decoration:none;font-size:14px}.drop a:hover{background:rgba(14,165,233,.1)}
  .right{margin-left:auto;display:flex;align-items:center;gap:8px;white-space:nowrap}
  .date{color:var(--mut);font-size:13px}.chip{background:rgba(14,165,233,.12);color:var(--pri-d);padding:4px 12px;border-radius:99px;font-size:13px;font-weight:500}
  .menu{display:none;background:none;border:0;font-size:22px;color:var(--tx)}
  .shell{display:flex;min-height:calc(100vh - 57px)}
  nav{width:230px;padding:16px 12px;background:linear-gradient(180deg,var(--card),rgba(186,230,253,.45));border-right:1px solid var(--bd);display:flex;flex-direction:column;gap:4px}
  nav a{padding:10px 12px;border-radius:10px;color:var(--mut);text-decoration:none;font-weight:500;transition:background .15s}
  nav a:hover{background:rgba(14,165,233,.1)}nav a.on{background:linear-gradient(90deg,#0ea5e9,#38bdf8);color:#fff}
  .tip{margin-top:auto;padding:14px;border-radius:14px;background:linear-gradient(135deg,#0ea5e9,#7dd3fc);color:#fff;font-size:13px}
  main{flex:1;padding:24px;max-width:1040px;margin:auto;min-width:0}
  .alert{display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(14,165,233,.1);border:1px solid var(--pri);border-radius:12px;padding:8px 12px;margin-bottom:8px}
  @media(max-width:1100px){.date{display:none}}
  @media(max-width:768px){.top{flex-wrap:wrap;padding:8px 12px}.menu{display:block}.sbox{order:5;flex-basis:100%;max-width:none}.chip{display:none}
    nav{position:fixed;top:104px;bottom:0;left:0;z-index:30;transform:translateX(-100%);transition:transform .2s}nav.open{transform:none}main{padding:16px}}`],
})
export class AppComponent {
  n = inject(NotificationService); d = inject(DataService); auth = inject(AuthService);
  open = signal(false); authOpen = signal(false); authMode = signal<'signin' | 'signup'>('signin');
  q = signal(''); showRes = signal(false);
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  constructor() { effect(() => { document.documentElement.dataset['theme'] = this.d.theme(); }); }
  openAuth(m: 'signin' | 'signup') { this.authMode.set(m); this.authOpen.set(true); }
  clear() { this.q.set(''); this.showRes.set(false); }
  onFocusOut(e: FocusEvent) { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) this.showRes.set(false); }
  results = computed(() => {
    const q = this.q().trim().toLowerCase(); if (!q) return null;
    const has = (...s: (string | undefined)[]) => s.join(' ').toLowerCase().includes(q);
    return {
      consults: this.d.consultations.items().filter(c => has(c.doctor, c.specialty, c.reason, c.notes)),
      meds: this.d.medications.items().filter(m => has(m.name, m.dose)),
      appts: this.d.appointments.items().filter(a => has(a.doctor, a.specialty)),
    };
  });
}
