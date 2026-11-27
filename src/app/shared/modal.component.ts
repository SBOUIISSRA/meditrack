import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-modal', standalone: true,
  template: `<div class="overlay" (click)="close.emit()" (keydown.escape)="close.emit()">
    <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
      <header><h3>{{ title() }}</h3><button class="x" aria-label="Fermer" (click)="close.emit()">✕</button></header>
      <ng-content/></div></div>`,
})
export class ModalComponent { title = input(''); close = output<void>(); }