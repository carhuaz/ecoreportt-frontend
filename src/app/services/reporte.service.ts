import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Reporte } from '../models/reporte.model';
import { Paginacion } from '../models/paginacion.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private mapReporte(r: any): Reporte {
    const criterios = typeof r.criterios_prioridad === 'string'
      ? JSON.parse(r.criterios_prioridad) : (r.criterios_prioridad || []);
    const imagenes = typeof r.imagenes === 'string'
      ? JSON.parse(r.imagenes) : (r.imagenes || []);

    return {
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      distrito: r.distrito,
      direccion: r.direccion,
      estado: r.estado,
      prioridad: r.prioridad,
      puntajePrioridad: r.puntaje_prioridad ?? r.puntajePrioridad,
      criteriosPrioridad: criterios,
      prioridadCorregida: !!r.prioridad_corregida,
      observacionPrioridad: r.observacion_prioridad,
      fecha: r.fecha || r.fecha_registro,
      latitud: r.latitud,
      longitud: r.longitud,
      imagenes,
      ciudadano: r.ciudadano || r.ciudadano_nombre,
      observacionValidacion: r.observacion_validacion,
      cuadrillaAsignada: r.cuadrilla_nombre || r.cuadrillaAsignada,
      historial: r.historial || []
    };
  }

  private paginada(url: string, params?: HttpParams): Observable<Paginacion<Reporte>> {
    return this.http.get<any>(url, { params }).pipe(
      map(res => ({
        ...res,
        items: res.items.map((r: any) => this.mapReporte(r))
      }))
    );
  }

  obtenerReportes(opts?: { page?: number; page_size?: number; estado?: string; distrito?: string; prioridad?: string }): Observable<Paginacion<Reporte>> {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', opts.page);
    if (opts?.page_size) params = params.set('page_size', opts.page_size);
    if (opts?.estado) params = params.set('estado', opts.estado);
    if (opts?.distrito) params = params.set('distrito', opts.distrito);
    if (opts?.prioridad) params = params.set('prioridad', opts.prioridad);
    return this.paginada(`${this.apiUrl}/reportes`, params);
  }

  obtenerReportesPublicos(opts?: { page?: number; page_size?: number; distrito?: string; estado?: string }): Observable<Paginacion<Reporte>> {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', opts.page);
    if (opts?.page_size) params = params.set('page_size', opts.page_size);
    if (opts?.distrito) params = params.set('distrito', opts.distrito);
    if (opts?.estado) params = params.set('estado', opts.estado);
    return this.paginada(`${this.apiUrl}/reportes/publicos`, params);
  }

  obtenerReportesPorCiudadano(page = 1, page_size = 20): Observable<Paginacion<Reporte>> {
    let params = new HttpParams().set('page', page).set('page_size', page_size);
    return this.paginada(`${this.apiUrl}/reportes/mis-reportes`, params);
  }

  agregarReporte(reporte: any): Observable<Reporte> {
    const body = {
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      distrito: reporte.distrito,
      direccion: reporte.direccion,
      latitud: reporte.latitud,
      longitud: reporte.longitud,
      imagenes: reporte.imagenes,
      prioridad: reporte.prioridad,
      puntaje_prioridad: reporte.puntajePrioridad || 0,
      criterios_prioridad: reporte.criteriosPrioridad || [],
      anonimo: reporte.anonimo || false
    };
    return this.http.post<any>(`${this.apiUrl}/reportes`, body).pipe(
      map(() => this.mapReporte({ ...reporte, ...body }))
    );
  }

  aprobarReporte(id: number, observacion: string, _validador: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/reportes/${id}/aprobar`, { observacion }).pipe(
      map(() => true)
    );
  }

  rechazarReporte(id: number, observacion: string, _validador: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/reportes/${id}/rechazar`, { observacion }).pipe(
      map(() => true)
    );
  }

  marcarEnAtencion(id: number, _usuario: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/reportes/${id}/atender`, {}).pipe(
      map(() => true)
    );
  }

  completarConEvidencias(id: number, evidencias: string[], observacion: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/reportes/${id}/completar-con-evidencias`, { evidencias, observacion }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  obtenerReportesPorCuadrilla(cuadrillaId: number, estado?: string, page = 1, pageSize = 50): Observable<Paginacion<Reporte>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (estado) params = params.set('estado', estado);
    return this.paginada(`${this.apiUrl}/reportes/cuadrilla/${cuadrillaId}`, params);
  }

  obtenerAuditoriaEvidencias(page = 1, pageSize = 20, cuadrillaId?: number, estado?: string): Observable<Paginacion<any>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    if (cuadrillaId) params = params.set('cuadrilla_id', cuadrillaId);
    if (estado) params = params.set('estado', estado);
    return this.http.get<any>(`${this.apiUrl}/reportes/auditoria-evidencias`, { params }).pipe(
      map(res => ({
        items: res.items,
        total: res.total,
        page: res.page,
        page_size: res.page_size,
        total_pages: res.total_pages
      }))
    );
  }

  obtenerResumenEstadisticas(): Observable<{ total_reportes: number; por_estado: { estado: string; cantidad: number }[]; por_distrito: { distrito: string; cantidad: number }[]; por_prioridad: { prioridad: string; cantidad: number }[] }> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/resumen`);
  }
}
