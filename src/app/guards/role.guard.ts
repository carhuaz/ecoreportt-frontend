import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    const usuario = this.authService.obtenerUsuarioActual();
    if (!usuario) {
      return this.authService.usuario$.pipe(
        filter(u => u !== null),
        take(1),
        map(u => this.checkRole(u, route))
      );
    }

    return of(this.checkRole(usuario, route));
  }

  private checkRole(usuario: any, route: ActivatedRouteSnapshot): boolean {
    const rolesRequeridos = route.data['roles'] as RolUsuario[];
    if (rolesRequeridos && !rolesRequeridos.includes(usuario.rol)) {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }
    return true;
  }
}
