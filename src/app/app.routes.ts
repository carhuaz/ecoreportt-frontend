import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./pages/verify/verify.component').then(m => m.VerifyComponent)
  },
  {
    path: 'reportes-publicos',
    loadComponent: () =>
      import('./pages/reportes-publicos/reportes-publicos.component')
        .then(m => m.ReportesPublicosComponent)
  },
  {
    path: 'mapa-ambiental',
    loadComponent: () =>
      import('./pages/mapa-ambiental/mapa-ambiental.component')
        .then(m => m.MapaAmbientalComponent)
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./pages/contacto/contacto.component').then(m => m.ContactoComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Ciudadano', 'Administrador'] }
  },
  {
    path: 'reportar',
    loadComponent: () =>
      import('./pages/reportar/reportar.component').then(m => m.ReportarComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Ciudadano'] }
  },
  {
    path: 'mis-reportes',
    loadComponent: () =>
      import('./pages/mis-reportes/mis-reportes.component').then(m => m.MisReportesComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Ciudadano'] }
  },
  {
    path: 'validacion',
    loadComponent: () =>
      import('./pages/validacion/validacion.component').then(m => m.ValidacionComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Validador'] }
  },
  {
    path: 'cuadrillas',
    loadComponent: () =>
      import('./pages/cuadrillas/cuadrillas.component').then(m => m.CuadrillasComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./pages/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'mis-cuadrillas',
    loadComponent: () =>
      import('./pages/mis-cuadrillas/mis-cuadrillas.component').then(m => m.MisCuadrillasComponent),
    canActivate: [RoleGuard],
    data: { roles: ['ResponsableCuadrilla'] }
  },
  {
    path: 'admin/auditoria',
    loadComponent: () =>
      import('./pages/admin-auditoria/admin-auditoria.component').then(m => m.AdminAuditoriaComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./pages/admin-usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./pages/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
