import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Usuario, RolUsuario } from '../../models/usuario.model';

interface MenuItem {
  label: string;
  ruta: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuAbierto = false;
  usuarioActual: Usuario | null = null;
  menuItems: MenuItem[] = [];
  private usuarioSub?: Subscription;

  private menusPorRol: Record<RolUsuario, MenuItem[]> = {
    'Ciudadano': [
      { label: 'Dashboard', ruta: '/dashboard', icon: '📊' },
      { label: 'Reportar', ruta: '/reportar', icon: '📝' },
      { label: 'Mis reportes', ruta: '/mis-reportes', icon: '📋' }
    ],
    'Validador': [
      { label: 'Validar reportes', ruta: '/validacion', icon: '✔️' }
    ],
    'ResponsableCuadrilla': [
      { label: 'Mis cuadrillas', ruta: '/mis-cuadrillas', icon: '🚚' }
    ],
    'Administrador': [
      { label: 'Dashboard', ruta: '/dashboard', icon: '📊' },
      { label: 'Gestión de usuarios', ruta: '/admin/usuarios', icon: '👥' },
      { label: 'Gestión de cuadrillas', ruta: '/cuadrillas', icon: '🚚' },
      { label: 'Estadísticas', ruta: '/estadisticas', icon: '📈' },
      { label: 'Auditoría', ruta: '/admin/auditoria', icon: '🔍' }
    ]
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.usuarioSub = this.authService.usuario$.subscribe(usuario => {
      this.usuarioActual = usuario;
      if (usuario) {
        this.menuItems = this.menusPorRol[usuario.rol] || [];
      } else {
        this.menuItems = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.usuarioSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  logout(): void {
    this.authService.logout();
    this.cerrarMenu();
    this.router.navigate(['/login']);
  }
}
