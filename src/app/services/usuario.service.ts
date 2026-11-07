import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.authService.obtenerTodosLosUsuarios();
  }

  obtenerUsuariosPaginados(page: number, pageSize: number, termino?: string, rol?: string): Observable<{ items: Usuario[]; total: number; page: number; page_size: number; total_pages: number }> {
    return this.authService.obtenerUsuariosPaginados(page, pageSize, termino, rol);
  }

  cambiarRolUsuario(id: number, nuevoRol: string): Observable<boolean> {
    return this.authService.cambiarRolUsuario(id, nuevoRol);
  }

  activarUsuario(id: number): Observable<boolean> {
    return this.authService.cambiarEstadoUsuario(id, true);
  }

  desactivarUsuario(id: number): Observable<boolean> {
    return this.authService.cambiarEstadoUsuario(id, false);
  }
}
