import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cuadrilla } from '../models/cuadrilla.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CuadrillaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerCuadrillas(): Observable<Cuadrilla[]> {
    return this.http.get<Cuadrilla[]>(`${this.apiUrl}/cuadrillas`);
  }

  obtenerMisCuadrillas(): Observable<Cuadrilla[]> {
    return this.http.get<Cuadrilla[]>(`${this.apiUrl}/cuadrillas/mis-cuadrillas`);
  }

  asignarCuadrilla(reporteId: number, cuadrillaId: number): Observable<boolean> {
    return this.http.post(
      `${this.apiUrl}/cuadrillas/${cuadrillaId}/asignar-revision?reporte_id=${reporteId}`, {}
    ).pipe(
      map(() => true)
    );
  }

  crearCuadrilla(data: { nombre: string; responsable?: string; distrito: string; zona_asignada?: string; responsable_id?: number | null }): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/cuadrillas`, data).pipe(
      map(() => true)
    );
  }

  actualizarCuadrilla(id: number, data: { nombre?: string; responsable?: string; distrito?: string; zona_asignada?: string; responsable_id?: number | null }): Observable<boolean> {
    return this.http.put(`${this.apiUrl}/cuadrillas/${id}`, data).pipe(
      map(() => true)
    );
  }

  eliminarCuadrilla(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/cuadrillas/${id}`).pipe(
      map(() => true)
    );
  }
}
