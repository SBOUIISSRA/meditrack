import { Component, inject, model, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ModalComponent } from './modal.component';
@Component({
  selector: 'app-auth-modal', standalone: true, imports: [ReactiveFormsModule, ModalComponent],
  template: `
  <app-modal [title]="mode() === 'signin' ? 'Se connecter' : 'Créer un compte'" (close)="close.emit()">
    @if (mode() === 'signin') {
      <form [formGroup]="fIn" (ngSubmit)="submitIn()">
        <label>E-mail<input class="in" type="email" formControlName="email" autocomplete="email">@if (bad(fIn, 'email')) { <span class="msg">Entrez un e-mail valide.</span> }</label>
        <label>Mot de passe<input class="in" type="password" formControlName="password" autocomplete="current-password">@if (bad(fIn, 'password')) { <span class="msg">Entrez votre mot de passe.</span> }</label>
        @if (err()) { <p class="msg" role="alert">{{ err() }}</p> }
        <button class="btn" type="submit" [disabled]="busy()">Se connecter</button>
      </form>
      <p class="muted">Pas encore de compte ? <button class="link" type="button" (click)="go('signup')">S'inscrire</button></p>
    } @else {
      <form [formGroup]="fUp" (ngSubmit)="submitUp()">
        <label>Nom complet<input class="in" formControlName="name" autocomplete="name">@if (bad(fUp, 'name')) { <span class="msg">Entrez votre nom.</span> }</label>
        <label>E-mail<input class="in" type="email" formControlName="email" autocomplete="email">@if (bad(fUp, 'email')) { <span class="msg">Entrez un e-mail valide.</span> }</label>
        <div class="row2">
          <label>Mot de passe<input class="in" type="password" formControlName="password" autocomplete="new-password">@if (bad(fUp, 'password')) { <span class="msg">6 caractères minimum.</span> }</label>
          <label>Confirmation<input class="in" type="password" formControlName="confirm" autocomplete="new-password">@if (sub() && fUp.errors?.['mismatch']) { <span class="msg">Les mots de passe diffèrent.</span> }</label>
        </div>
        @if (err()) { <p class="msg" role="alert">{{ err() }}</p> }
        <button class="btn" type="submit" [disabled]="busy()">Créer mon compte</button>
      </form>
      <p class="muted">Déjà inscrit ? <button class="link" type="button" (click)="go('signin')">Se connecter</button></p>
    }
    <p class="muted"><small>Démo : les comptes sont enregistrés uniquement dans ce navigateur.</small></p>
  </app-modal>`,
})
export class AuthModalComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService);
  mode = model<'signin' | 'signup'>('signin'); close = output<void>();
  sub = signal(false); busy = signal(false); err = signal('');
  fIn = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  fUp = this.fb.nonNullable.group(
    { name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]], confirm: ['', Validators.required] },
    { validators: (g: AbstractControl) => (g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true }) });
  bad(f: AbstractControl, k: string) { return this.sub() && f.get(k)!.invalid; }
  go(m: 'signin' | 'signup') { this.mode.set(m); this.sub.set(false); this.err.set(''); }
  async submitIn() {
    this.sub.set(true); if (this.fIn.invalid) return;
    this.busy.set(true); const { email, password } = this.fIn.getRawValue();
    const e = await this.auth.signIn(email, password); this.busy.set(false);
    e ? this.err.set(e) : this.close.emit();
  }
  async submitUp() {
    this.sub.set(true); if (this.fUp.invalid) return;
    this.busy.set(true); const { name, email, password } = this.fUp.getRawValue();
    const e = await this.auth.signUp(name, email, password); this.busy.set(false);
    e ? this.err.set(e) : this.close.emit();
  }
}
