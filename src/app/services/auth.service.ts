import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

interface LoginResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  token: string;
  fecha_registro?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'ecoreport_token';
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  init(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.http.get<Usuario>(`${this.apiUrl}/auth/me`).subscribe({
        next: user => {
          this.usuarioSubject.next(user);
          resolve();
        },
        error: () => {
          this.logout();
          resolve();
        }
      });
    });
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string): Observable<{ ok: boolean; noVerificado?: boolean }> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        const usr = res as any;
        this.usuarioSubject.next({
          id: usr.id,
          nombre: usr.nombre,
          email: usr.email,
          rol: usr.rol as Usuario['rol'],
          activo: usr.activo,
          fechaRegistro: usr.fecha_registro || ''
        });
      }),
      map(() => ({ ok: true })),
      catchError(err => {
        if (err.status === 403 && err.error?.detail?.includes?.('no verificada')) {
          return of({ ok: false, noVerificado: true });
        }
        return of({ ok: false });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.usuarioSubject.next(null);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  obtenerRutaInicial(): string {
    switch (this.usuarioSubject.value?.rol) {
      case 'Validador': return '/validacion';
      case 'ResponsableCuadrilla': return '/mis-cuadrillas';
      case 'Administrador':
      case 'Ciudadano': return '/dashboard';
      default: return '/login';
    }
  }

  registrarUsuario(nombre: string, email: string, password: string, dni: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/register`, { nombre, email, password, dni }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  verificarCodigo(email: string, codigo: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/verify`, { email, codigo }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  reenviarCodigo(email: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/reenviar-codigo`, { email, codigo: '' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  obtenerTodosLosUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  obtenerUsuariosPaginados(page: number, pageSize: number, termino?: string, rol?: string): Observable<{ items: Usuario[]; total: number; page: number; page_size: number; total_pages: number }> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (termino) params = params.set('termino', termino);
    if (rol) params = params.set('rol', rol);
    return this.http.get<any>(`${this.apiUrl}/usuarios`, { params });
  }

  cambiarRolUsuario(idUsuario: number, nuevoRol: string): Observable<boolean> {
    return this.http.put(`${this.apiUrl}/usuarios/${idUsuario}/rol`, { rol: nuevoRol }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  cambiarEstadoUsuario(idUsuario: number, activo: boolean): Observable<boolean> {
    const accion = activo ? 'activar' : 'desactivar';
    return this.http.put(`${this.apiUrl}/usuarios/${idUsuario}/${accion}`, {}).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
