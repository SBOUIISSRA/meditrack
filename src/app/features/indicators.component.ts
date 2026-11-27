import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data.service';
import { METRICS, Measure, MetricType } from '../core/models';
import { LineChartComponent } from '../shared/line-chart.component';
import { ModalComponent } from '../shared/modal.component';
@Component({
  selector: 'app-indicators', standalone: true, imports: [ReactiveFormsModule, DatePipe, LineChartComponent, ModalComponent],
  template: `
  <div class="head"><div><h2>Suivi de santé</h2><p class="sub">Vos mesures et leur évolution</p></div>
    <button class="btn" (click)="openForm()">Ajouter une mesure</button></div>

  <div class="grid last">
    @for (k of keys; track k) {
      <button class="card tile" [class.sel]="k === type()" (click)="setType(k)">
        <span class="muted">{{ M[k].label }}</span>
        @if (last(k); as m) { <b>{{ m.value }}{{ m.value2 ? '/' + m.value2 : '' }} <small>{{ M[k].unit }}</small></b><span class="muted">{{ m.date | date:'dd/MM/yyyy' }}</span> }
        @else { <b>—</b><span class="muted">Aucune mesure</span> }
      </button>
    }
  </div>

  <div class="card">
    <div class="tools">
      <h3 style="flex:1;margin:0;align-self:center">{{ M[type()].label }} ({{ M[type()].unit }})</h3>
      <label class="fl">Du<input class="in" type="date" [value]="from()" (input)="from.set($any($event.target).value)"></label>
      <label class="fl">Au<input class="in" type="date" [value]="to()" (input)="to.set($any($event.target).value)"></label>
      @if (from() || to()) { <button class="btn ghost sm" (click)="from.set(''); to.set('')">Effacer le filtre</button> }
    </div>
    <app-line-chart [pts]="series()"/>
    @if (type() === 'poids' && bmi()) { <p class="muted">IMC estimé : <b>{{ bmi() }}</b> (indicatif, pas un diagnostic)</p> }
  </div>

  <div class="card">
    <h3>Comparer deux mesures</h3>
    <div class="tools">
      <select class="in" aria-label="Première mesure" (change)="cmpA.set($any($event.target).value)"><option value="">Mesure A</option>@for (m of all(); track m.id) { <option [value]="m.id">{{ m.date }}</option> }</select>
      <select class="in" aria-label="Deuxième mesure" (change)="cmpB.set($any($event.target).value)"><option value="">Mesure B</option>@for (m of all(); track m.id) { <option [value]="m.id">{{ m.date }}</option> }</select>
    </div>
    @if (diff(); as d) { <p style="margin:0">Écart : <b>{{ d }}</b> {{ M[type()].unit }}</p> } @else { <p class="muted" style="margin:0">Choisissez deux dates pour voir l'écart.</p> }
  </div>

  <div class="card">
    <h3>Historique</h3>
    @if (history().length) {
    <div class="scroll"><table><thead><tr><th>Date</th><th>Valeur</th><th>Repère</th><th></th></tr></thead><tbody>
      @for (m of history(); track m.id) { <tr><td>{{ m.date | date:'dd/MM/yyyy' }}</td><td>{{ m.value }}{{ m.value2 ? '/' + m.value2 : '' }} {{ M[type()].unit }}</td>
        <td>@if (out(m)) { <span class="badge warn">Hors repère</span> } @else { <span class="badge">Dans le repère</span> }</td>
        <td><button class="btn ghost sm" (click)="openForm(m.id)">Modifier</button> <button class="btn ghost sm del" (click)="remove(m.id)">Supprimer</button></td></tr> }
    </tbody></table></div>
    } @else { <div class="empty">Aucune mesure sur cette période. Ajoutez-en une avec le bouton en haut.</div> }
  </div>
  <p class="muted"><small>Les repères sont indicatifs. MediTrack ne fournit aucun diagnostic médical : consultez un professionnel de santé.</small></p>

  @if (show()) {
  <app-modal [title]="(editId ? 'Modifier la mesure' : 'Nouvelle mesure') + ' · ' + M[type()].label" (close)="show.set(false)">
    <form [formGroup]="f" (ngSubmit)="save()">
      <label>Date<input class="in" type="date" formControlName="date">@if (bad('date')) { <span class="msg">Choisissez une date.</span> }</label>
      <div [class.row2]="type() === 'tension'">
        <label>{{ type() === 'tension' ? 'Systolique' : 'Valeur' }} ({{ M[type()].unit }})<input class="in" type="number" step="any" formControlName="value">@if (bad('value')) { <span class="msg">Entrez une valeur supérieure à 0.</span> }</label>
        @if (type() === 'tension') { <label>Diastolique<input class="in" type="number" step="any" formControlName="value2">@if (bad('value2')) { <span class="msg">Entrez une valeur supérieure à 0.</span> }</label> }
      </div>
      <button class="btn" type="submit">Enregistrer</button> <button class="btn ghost" type="button" (click)="show.set(false)">Annuler</button>
    </form>
  </app-modal> }`,
  styles: [`.last{margin-bottom:16px}.tile{text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;font:inherit;color:inherit;transition:border-color .15s}
  .tile b{font:800 22px Manrope}.tile small{font:500 13px 'DM Sans';color:var(--mut)}.tile:hover{border-color:var(--pri)}.tile.sel{border-color:var(--pri);box-shadow:0 0 0 1px var(--pri)}
  .fl{margin:0;display:flex;align-items:center;gap:6px}.fl .in{width:auto}.badge.warn{background:#fdeceb;color:var(--bad)}`],
})
export class IndicatorsComponent {
  data = inject(DataService); private fb = inject(FormBuilder);
  M = METRICS; keys = Object.keys(METRICS) as MetricType[];
  type = signal<MetricType>('tension'); from = signal(''); to = signal(''); cmpA = signal(''); cmpB = signal('');
  show = signal(false); submitted = signal(false); editId: string | null = null;
  f = this.fb.group({ date: [new Date().toISOString().slice(0, 10), Validators.required], value: [null as number | null, [Validators.required, Validators.min(0.1)]], value2: [null as number | null] });
  constructor() { if (inject(ActivatedRoute).snapshot.queryParamMap.has('new')) this.openForm(); }
  all = computed(() => this.data.measures.items().filter(m => m.type === this.type()).sort((a, b) => a.date.localeCompare(b.date)));
  list = computed(() => this.all().filter(m => (!this.from() || m.date >= this.from()) && (!this.to() || m.date <= this.to())));
  history = computed(() => [...this.list()].reverse());
  series = computed(() => this.list().map(m => ({ label: m.date, v: m.value, v2: m.value2 })));
  bmi = computed(() => {
    const w = this.last('poids'), h = this.last('taille'); return w && h ? +(w.value / (h.value / 100) ** 2).toFixed(1) : null;
  });
  diff = computed(() => {
    const a = this.all().find(m => m.id === this.cmpA()), b = this.all().find(m => m.id === this.cmpB());
    if (!a || !b) return '';
    const d = (x: number) => (x > 0 ? '+' : '') + +x.toFixed(2);
    return a.value2 != null && b.value2 != null ? `${d(b.value - a.value)}/${d(b.value2 - a.value2)}` : d(b.value - a.value);
  });
  last(t: MetricType): Measure | undefined { return this.data.measures.items().filter(m => m.type === t).sort((a, b) => b.date.localeCompare(a.date))[0]; }
  out(m: Measure) { const r = METRICS[m.type]; return (r.min != null && m.value < r.min) || (r.max != null && m.value > r.max); }
  setType(t: MetricType) { this.type.set(t); this.cmpA.set(''); this.cmpB.set(''); }
  bad(k: 'date' | 'value' | 'value2') { return this.submitted() && this.f.controls[k].invalid; }
  openForm(id?: string) {
    this.editId = id ?? null; const m = id ? this.data.measures.items().find(x => x.id === id) : null;
    this.f.controls.value2.setValidators(this.type() === 'tension' ? [Validators.required, Validators.min(0.1)] : []);
    this.f.reset({ date: m?.date ?? new Date().toISOString().slice(0, 10), value: m?.value ?? null, value2: m?.value2 ?? null });
    this.submitted.set(false); this.show.set(true);
  }
  save() {
    this.submitted.set(true); if (this.f.invalid) return;
    const v = this.f.getRawValue();
    const p = { type: this.type(), date: v.date!, value: v.value!, ...(this.type() === 'tension' ? { value2: v.value2! } : {}) };
    this.editId ? this.data.measures.update(this.editId, p) : this.data.measures.add(p);
    this.show.set(false);
  }
  remove(id: string) { if (confirm('Supprimer cette mesure ?')) this.data.measures.remove(id); }
}
