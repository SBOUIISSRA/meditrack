import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data.service';
import { ModalComponent } from '../shared/modal.component';
@Component({
  selector: 'app-consultations', standalone: true, imports: [ReactiveFormsModule, DatePipe, ModalComponent],
  template: `
  <div class="head"><div><h2>Consultations</h2><p class="sub">L'historique de vos visites médicales</p></div>
    <button class="btn" (click)="openForm()">Ajouter une consultation</button></div>
  <div class="card">
    <div class="tools">
      <input class="in search" type="search" placeholder="Rechercher par médecin ou par maladie…" aria-label="Rechercher" (input)="q.set($any($event.target).value)">
      <select class="in" aria-label="Spécialité" (change)="sp.set($any($event.target).value)"><option value="">Toutes les spécialités</option>@for (s of specialties(); track s) { <option>{{ s }}</option> }</select>
      <button class="btn ghost" (click)="asc.set(!asc())">Date {{ asc() ? '↑' : '↓' }}</button>
    </div>
    @if (rows().length) {
    <div class="scroll"><table><thead><tr><th>Date</th><th>Médecin</th><th>Spécialité</th><th>Motif / maladie</th><th>Notes</th><th></th></tr></thead><tbody>
      @for (c of rows(); track c.id) { <tr><td>{{ c.date | date:'dd/MM/yyyy' }}</td><td>Dr {{ c.doctor }}</td><td>{{ c.specialty }}</td><td class="wrap">{{ c.reason }}</td><td class="wrap muted">{{ c.notes || '—' }}</td>
        <td><button class="btn ghost sm" (click)="openForm(c.id)">Modifier</button> <button class="btn ghost sm del" (click)="remove(c.id)">Supprimer</button></td></tr> }
    </tbody></table></div>
    } @else { <div class="empty">Aucune consultation ne correspond. Ajoutez-en une ou modifiez vos filtres.</div> }
  </div>
  @if (show()) {
  <app-modal [title]="editId ? 'Modifier la consultation' : 'Nouvelle consultation'" (close)="show.set(false)">
    <form [formGroup]="f" (ngSubmit)="save()">
      <label>Médecin<input class="in" formControlName="doctor">@if (bad('doctor')) { <span class="msg">Indiquez le nom du médecin.</span> }</label>
      <div class="row2">
        <label>Spécialité<input class="in" formControlName="specialty">@if (bad('specialty')) { <span class="msg">Champ requis.</span> }</label>
        <label>Date<input class="in" type="date" formControlName="date">@if (bad('date')) { <span class="msg">Choisissez une date.</span> }</label>
      </div>
      <label>Motif / maladie<input class="in" formControlName="reason">@if (bad('reason')) { <span class="msg">Indiquez le motif.</span> }</label>
      <label>Notes<textarea class="in" rows="3" formControlName="notes"></textarea></label>
      <button class="btn" type="submit">Enregistrer</button> <button class="btn ghost" type="button" (click)="show.set(false)">Annuler</button>
    </form>
  </app-modal> }`,
})
export class ConsultationsComponent {
  private d = inject(DataService); private fb = inject(FormBuilder);
  q = signal(''); sp = signal(''); asc = signal(false); show = signal(false); editId: string | null = null;
  f = this.fb.nonNullable.group({ doctor: ['', Validators.required], specialty: ['', Validators.required], date: ['', Validators.required], reason: ['', Validators.required], notes: [''] });
  specialties = computed(() => [...new Set(this.d.consultations.items().map(c => c.specialty))].sort());
  rows = computed(() => {
    const q = this.q().toLowerCase(), s = this.sp();
    return this.d.consultations.items()
      .filter(c => (!s || c.specialty === s) && (!q || `${c.doctor} ${c.specialty} ${c.reason} ${c.notes}`.toLowerCase().includes(q)))
      .sort((a, b) => (this.asc() ? 1 : -1) * a.date.localeCompare(b.date));
  });
  submitted = signal(false);
  constructor() { if (inject(ActivatedRoute).snapshot.queryParamMap.has('new')) this.openForm(); }
  bad(k: 'doctor' | 'specialty' | 'date' | 'reason') { return this.submitted() && this.f.controls[k].invalid; }
  openForm(id?: string) {
    this.editId = id ?? null; const c = id ? this.d.consultations.items().find(x => x.id === id) : null;
    this.f.reset(c ? { doctor: c.doctor, specialty: c.specialty, date: c.date, reason: c.reason, notes: c.notes } : { doctor: '', specialty: '', date: new Date().toISOString().slice(0, 10), reason: '', notes: '' });
    this.submitted.set(false); this.show.set(true);
  }
  save() {
    this.submitted.set(true); if (this.f.invalid) return;
    const v = this.f.getRawValue();
    this.editId ? this.d.consultations.update(this.editId, v) : this.d.consultations.add(v);
    this.show.set(false);
  }
  remove(id: string) { if (confirm('Supprimer cette consultation ?')) this.d.consultations.remove(id); }
}
