import { Component, computed, input } from '@angular/core';
export interface Pt { label: string; v: number; v2?: number; }
@Component({
  selector: 'app-line-chart', standalone: true,
  template: `
  @if (pts().length < 2) { <p class="muted">Au moins 2 mesures sont nécessaires pour afficher un graphique.</p> }
  @else {
  <svg viewBox="0 0 400 180" class="chart">
    <line x1="30" y1="10" x2="30" y2="150" stroke="#999"/><line x1="30" y1="150" x2="390" y2="150" stroke="#999"/>
    <text x="2" y="14" font-size="9">{{ max().toFixed(1) }}</text><text x="2" y="150" font-size="9">{{ min().toFixed(1) }}</text>
    <polyline [attr.points]="line(false)" fill="none" stroke="#0a7ea4" stroke-width="2"/>
    @if (hasV2()) { <polyline [attr.points]="line(true)" fill="none" stroke="#e5484d" stroke-width="2"/> }
    @for (p of pts(); track $index) { <circle [attr.cx]="x($index)" [attr.cy]="y(p.v)" r="3" fill="#0a7ea4"/>
      <text [attr.x]="x($index)" y="168" font-size="8" text-anchor="middle">{{ p.label.slice(5) }}</text> }
  </svg>}`,
  styles: ['.chart{width:100%;max-width:520px}.muted{color:#777}'],
})
export class LineChartComponent {
  pts = input<Pt[]>([]);
  hasV2 = computed(() => this.pts().some(p => p.v2 != null));
  private all = computed(() => this.pts().flatMap(p => [p.v, ...(p.v2 != null ? [p.v2] : [])]));
  min = computed(() => Math.min(...this.all()) * 0.95);
  max = computed(() => Math.max(...this.all()) * 1.05);
  x(i: number) { return 40 + (i * 340) / Math.max(1, this.pts().length - 1); }
  y(v: number) { return 150 - ((v - this.min()) / (this.max() - this.min() || 1)) * 130; }
  line(second: boolean) { return this.pts().map((p, i) => `${this.x(i)},${this.y(second ? p.v2 ?? p.v : p.v)}`).join(' '); }
}
