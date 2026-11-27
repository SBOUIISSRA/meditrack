import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data.service';
import { ModalComponent } from '../shared/modal.component';
@Component({
  selector: 'app-medications', standalone: true, imports: [ReactiveFormsModule, DatePipe, ModalComponent],
  template: `
  <div class="head"><div><h2>Médicaments</h2><p class="sub">Vos traitements en cours et terminés</p></div>
    <button class="btn" (click)="openForm()">Ajouter un médicament</button></div>
  <div class="tools">
    <input class="in search" type="search" placeholder="Rechercher un médicament…" aria-label="Rechercher un médicament" (input)="q.set($any($event.target).value)">
    @for (o of opts; track o[0]) { <button class="btn sm" [class.ghost]="filter() !== o[0]" (click)="filter.set(o[0])">{{ o[1] }}</button> }
  </div>
  <div class="grid">
    @for (m of rows(); track m.id) {
      <div class="card"><div style="display:flex;justify-content:space-between;align-items:start"><h3>{{ m.name }}</h3>
        <span class="badge" [class.done]="m.status === 'completed'">{{ m.status === 'active' ? 'En cours' : 'Terminé' }}</span></div>
        <p style="margin:0">{{ m.dose }} · {{ m.frequency }}</p>
        <p class="muted">Du {{ m.start | date:'dd/MM/yyyy' }}{{ m.end ? ' au ' + (m.end | date:'dd/MM/yyyy') : '' }}</p>
        <div class="tools" style="margin:0">
          @if (m.status === 'active') { <button class="btn sm" (click)="complete(m.id)">Marquer comme terminé</button> }
          <button class="btn ghost sm" (click)="openForm(m.id)">Modifier</button><button class="btn ghost sm del" (click)="remove(m.id)">Supprimer</button></div></div>
    } @empty { <div class="card empty" style="grid-column:1/-1">Aucun médicament dans cette liste.</div> }
  </div>
  @if (show()) {
  <app-modal [title]="editId ? 'Modifier le médicament' : 'Nouveau médicament'" (close)="show.set(false)">
    <form [formGroup]="f" (ngSubmit)="save()">
      <label>Nom<input class="in" formControlName="name">@if (bad('name')) { <span class="msg">Indiquez le nom.</span> }</label>
      <div class="row2">
        <label>Dosage<input class="in" formControlName="dose" placeholder="ex. 500 mg">@if (bad('dose')) { <span class="msg">Champ requis.</span> }</label>
        <label>Fréquence<input class="in" formControlName="frequency" placeholder="ex. 2 fois par jour">@if (bad('frequency')) { <span class="msg">Champ requis.</span> }</label>
      </div>
      <div class="row2">
        <label>Début<input class="in" type="date" formControlName="start">@if (bad('start')) { <span class="msg">Choisissez une date.</span> }</label>
        <label>Fin (facultatif)<input class="in" type="date" formControlName="end"></label>
      </div>
      @if (f.errors?.['range']) { <p class="msg">La date de fin doit suivre la date de début.</p> }
      <button class="btn" type="submit">Enregistrer</button> <button class="btn ghost" type="button" (click)="show.set(false)">Annuler</button>
    </form>
  </app-modal> }`,
})
export class MedicationsComponent {
  private d = inject(DataService); private fb = inject(FormBuilder);
  opts: [string, string][] = [['all', 'Tous'], ['active', 'En cours'], ['completed', 'Terminés']];
  filter = signal('active'); q = signal(''); show = signal(false); editId: string | null = null;
  f = this.fb.nonNullable.group({ name: ['', Validators.required], dose: ['', Validators.required], frequency: ['', Validators.required], start: ['', Validators.required], end: [''] },
    { validators: g => (g.value.end && g.value.start && g.value.end < g.value.start ? { range: true } : null) });
  rows = computed(() => this.d.medications.items().filter(m => (this.filter() === 'all' || m.status === this.filter()) && (!this.q().trim() || `${m.name} ${m.dose}`.toLowerCase().includes(this.q().trim().toLowerCase()))));
  submitted = signal(false);
  constructor() { if (inject(ActivatedRoute).snapshot.queryParamMap.has('new')) this.openForm(); }
  bad(k: 'name' | 'dose' | 'frequency' | 'start') { return this.submitted() && this.f.controls[k].invalid; }
  openForm(id?: string) {
    this.editId = id ?? null; const m = id ? this.d.medications.items().find(x => x.id === id) : null;
    this.f.reset(m ? { name: m.name, dose: m.dose, frequency: m.frequency, start: m.start, end: m.end ?? '' } : { name: '', dose: '', frequency: '', start: new Date().toISOString().slice(0, 10), end: '' });
    this.submitted.set(false); this.show.set(true);
  }
  save() {
    this.submitted.set(true); if (this.f.invalid) return;
    const { end, ...v } = this.f.getRawValue(), data = { ...v, end: end || undefined };
    this.editId ? this.d.medications.update(this.editId, data) : this.d.medications.add({ ...data, status: 'active' });
    this.show.set(false);
  }
  complete(id: string) { this.d.medications.update(id, { status: 'completed', end: new Date().toISOString().slice(0, 10) }); }
  remove(id: string) { if (confirm('Supprimer ce médicament ?')) this.d.medications.remove(id); }
}
