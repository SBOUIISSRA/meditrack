import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accueil' },
  { path: 'accueil', loadComponent: () => import('./features/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'consultations', loadComponent: () => import('./features/consultations.component').then(m => m.ConsultationsComponent) },
  { path: 'medicaments', loadComponent: () => import('./features/medications.component').then(m => m.MedicationsComponent) },
  { path: 'suivi', loadComponent: () => import('./features/indicators.component').then(m => m.IndicatorsComponent) },
  { path: '**', redirectTo: 'accueil' },
];