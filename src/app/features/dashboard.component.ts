import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { AuthService } from '../core/auth.service';
import { LineChartComponent } from '../shared/line-chart.component';
@Component({
  selector: 'app-dashboard', standalone: true, imports: [DatePipe, RouterLink, LineChartComponent],
  template: `
  <section class="hero">
    <div>
      @if (auth.user(); as u) { <h2>Bonjour, {{ u.name }} 👋</h2> } @else { <h2>Bienvenue sur MediTrack</h2> }
      <p>Votre dossier médical personnel : consultations, traitements et mesures de santé, au même endroit.@if (!auth.user()) { Inscrivez-vous ou connectez-vous avec les boutons en haut de la page. }</p>
      <div class="cta"><a class="btn light" routerLink="/consultations" [queryParams]="{ new: 1 }">+ Ajouter une consultation</a><a class="btn outline-w" routerLink="/suivi" [queryParams]="{ new: 1 }">+ Ajouter une mesure</a></div>
    </div>
    <img src="hero.svg" alt="" width="240" height="180">
  </section>

  <div class="grid" style="margin-bottom:16px">
    <div class="card stat"><b>{{ d.consultations.items().length }}</b>🩺 Consultations</div>
    <div class="card stat"><b>{{ activeMeds().length }}</b>💊 Traitements actifs</div>
    <div class="card stat"><b>{{ upcoming().length }}</b>📅 Rendez-vous à venir</div>
    <div class="card stat"><b>{{ d.measures.items().length }}</b>📈 Mesures enregistrées</div>
  </div>
  <div class="grid">
    <div class="card"><h3>Prochains rendez-vous</h3>
      @for (a of upcoming().slice(0, 3); track a.id) { <p>{{ a.datetime | date:'dd/MM/yyyy HH:mm' }}<br><span class="muted">Dr {{ a.doctor }} · {{ a.specialty }}</span></p> } @empty { <p class="muted">Aucun rendez-vous prévu.</p> }</div>
    <div class="card"><h3>Activité récente</h3>
      @for (c of recent(); track c.id) { <p>{{ c.date | date:'dd/MM/yyyy' }} – {{ c.reason }}<br><span class="muted">Dr {{ c.doctor }}</span></p> } @empty { <p class="muted">Aucune consultation.</p> }</div>
  </div>
  <div class="grid" style="margin-top:16px">
    <div class="card"><h3>Évolution du poids (kg)</h3><app-line-chart [pts]="weight()"/></div>
    <div class="card"><h3>Évolution de la tension (mmHg)</h3><app-line-chart [pts]="tension()"/></div>
  </div>`,
})
export class DashboardComponent {
  d = inject(DataService); auth = inject(AuthService);
  upcoming = computed(() => this.d.appointments.items().filter(a => !a.cancelled && new Date(a.datetime) >= new Date()).sort((a, b) => a.datetime.localeCompare(b.datetime)));
  activeMeds = computed(() => this.d.medications.items().filter(m => m.status === 'active'));
  recent = computed(() => [...this.d.consultations.items()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3));
  private ser(t: string) { return this.d.measures.items().filter(m => m.type === t).sort((a, b) => a.date.localeCompare(b.date)).map(m => ({ label: m.date, v: m.value, v2: m.value2 })); }
  weight = computed(() => this.ser('poids')); tension = computed(() => this.ser('tension'));
}
