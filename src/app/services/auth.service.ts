import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
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

export interface AuthResult {
  ok: boolean;
  mensaje?: string;
  status?: number;
  noVerificado?: boolean;
  cooldownSegundos?: number;
  intentosRestantes?: number;
}

export function mapearErrorAuth(err: unknown, fallback: string): AuthResult {
  const status = err instanceof HttpErrorResponse ? err.status : 0;
  const detail = err instanceof HttpErrorResponse && typeof err.error?.detail === 'string'
    ? err.error.detail
    : '';
  const mensaje = detail || fallback;
  const cooldown = /Espera\s+(\d+)\s+segundos/i.exec(mensaje);
  const intentos = /Te quedan\s+(\d+)\s+intentos/i.exec(mensaje);

  return {
    ok: false,
    status,
    mensaje,
    cooldownSegundos: cooldown ? Number(cooldown[1]) : undefined,
    intentosRestantes: intentos ? Number(intentos[1]) : undefined,
    noVerificado: status === 403 && /no verificada/i.test(mensaje)
  };
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
          this.usuarioSubject.next(this.mapUsuario(user));
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
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;
    if (this.tokenExpirado(token)) {
      localStorage.removeItem(this.tokenKey);
      return null;
    }
    return token;
  }

  private tokenExpirado(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return true;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      const decoded = JSON.parse(atob(padded));
      return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  private mapUsuario(raw: any): Usuario {
    return {
      id: raw.id,
      nombre: raw.nombre,
      email: raw.email,
      rol: raw.rol as Usuario['rol'],
      activo: !!raw.activo,
      fechaRegistro: raw.fechaRegistro || raw.fecha_registro || ''
    };
  }

  login(email: string, password: string): Observable<AuthResult> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        this.usuarioSubject.next(this.mapUsuario(res));
      }),
      map(() => ({ ok: true })),
      catchError(err => of(mapearErrorAuth(
        err,
        'Correo o contraseña incorrectos, o el usuario está inactivo.'
      )))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.usuarioSubject.next(null);
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
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

  registrarUsuario(nombre: string, email: string, password: string, dni: string): Observable<AuthResult> {
    return this.http.post<{ mensaje?: string }>(`${this.apiUrl}/auth/register`, { nombre, email, password, dni }).pipe(
      map(res => ({ ok: true, mensaje: res?.mensaje })),
      catchError(err => of(mapearErrorAuth(err, 'No se pudo registrar la cuenta.')))
    );
  }

  verificarCodigo(email: string, codigo: string): Observable<AuthResult> {
    return this.http.post<{ mensaje?: string }>(`${this.apiUrl}/auth/verify`, { email, codigo }).pipe(
      map(res => ({ ok: true, mensaje: res?.mensaje })),
      catchError(err => of(mapearErrorAuth(err, 'Código incorrecto. Revisa tu correo o solicita uno nuevo.')))
    );
  }

  reenviarCodigo(email: string): Observable<AuthResult> {
    return this.http.post<{ mensaje?: string }>(`${this.apiUrl}/auth/reenviar-codigo`, { email, codigo: '' }).pipe(
      map(res => ({ ok: true, mensaje: res?.mensaje })),
      catchError(err => of(mapearErrorAuth(err, 'No se pudo reenviar el código. Intenta de nuevo.')))
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
