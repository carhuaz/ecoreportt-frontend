import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { CuadrillaService } from '../../services/cuadrilla.service';
import { ReporteService } from '../../services/reporte.service';
import { Cuadrilla } from '../../models/cuadrilla.model';
import { Paginacion } from '../../models/paginacion.model';
import { Reporte } from '../../models/reporte.model';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';

@Component({
    selector: 'app-mis-cuadrillas',
    imports: [CommonModule, FormsModule, BadgeEstadoComponent, ImageUploaderComponent],
    templateUrl: './mis-cuadrillas.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./mis-cuadrillas.component.css']
})
export class MisCuadrillasComponent implements OnInit {
  cuadrillas: Cuadrilla[] = [];
  reportesPorCuadrilla: Record<number, Reporte[]> = {};
  cuadrillaSeleccionada: number | null = null;
  cargando = false;
  mensajeExito = '';
  mensajeError = '';

  modalCompletarAbierto = false;
  reporteACompletar: Reporte | null = null;
  evidencias: string[] = [];
  observacion = '';

  constructor(
    private cuadrillaService: CuadrillaService,
    private reporteService: ReporteService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cuadrillaService.obtenerMisCuadrillas().subscribe({
      next: data => {
        this.cuadrillas = data;
        if (data.length > 0) {
          this.cuadrillaSeleccionada = data[0].id;
          this.cargarReportes();
        }
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(err, 'No se pudieron cargar tus cuadrillas.');
      }
    });
  }

  seleccionarCuadrilla(id: number): void {
    this.cuadrillaSeleccionada = id;
    this.cargarReportes();
  }

  cargarReportes(): void {
    const cuadrillaId = this.cuadrillaSeleccionada;
    if (!cuadrillaId) return;

    const pageSize = 100;
    this.reporteService.obtenerReportesPorCuadrilla(cuadrillaId, undefined, 1, pageSize).subscribe({
      next: first => {
        if (first.total_pages <= 1) {
          this.reportesPorCuadrilla[cuadrillaId] = first.items;
          return;
        }

        const paginas: Observable<Paginacion<Reporte>>[] = [];
        for (let page = 2; page <= first.total_pages; page++) {
          paginas.push(this.reporteService.obtenerReportesPorCuadrilla(cuadrillaId, undefined, page, pageSize));
        }

        forkJoin(paginas).subscribe({
          next: results => {
            this.reportesPorCuadrilla[cuadrillaId] = first.items.concat(
              ...results.map(result => result.items)
            );
          },
          error: (err: HttpErrorResponse) => this.mostrarError(err, 'No se pudieron cargar todos los reportes de la cuadrilla.')
        });
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'No se pudieron cargar los reportes de la cuadrilla.')
    });
  }

  get reportesActuales(): Reporte[] {
    return this.cuadrillaSeleccionada ? (this.reportesPorCuadrilla[this.cuadrillaSeleccionada] || []) : [];
  }

  get cuadrillaActual(): Cuadrilla | undefined {
    return this.cuadrillas.find(c => c.id === this.cuadrillaSeleccionada);
  }

  get reportesActivos(): Reporte[] {
    return this.reportesActuales.filter(r => r.estado === 'Programado' || r.estado === 'En atención');
  }

  get reportesCompletados(): Reporte[] {
    return this.reportesActuales.filter(r => r.estado === 'Atendido' || r.estado === 'Verificado');
  }

  marcarAtencion(reporte: Reporte): void {
    if (!confirm(`¿Iniciar atención del reporte "${reporte.titulo}"?`)) return;
    this.reporteService.marcarEnAtencion(reporte.id, '').subscribe({
      next: () => {
        this.mensajeExito = 'Atención iniciada';
        this.cargarReportes();
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'Error al iniciar atención.')
    });
  }

  abrirModalCompletar(reporte: Reporte): void {
    this.reporteACompletar = reporte;
    this.evidencias = [];
    this.observacion = '';
    this.modalCompletarAbierto = true;
  }

  cerrarModalCompletar(): void {
    this.modalCompletarAbierto = false;
    this.reporteACompletar = null;
    this.evidencias = [];
    this.observacion = '';
  }

  completarReporte(): void {
    if (!this.reporteACompletar) return;
    this.reporteService.completarConEvidencias(this.reporteACompletar.id, this.evidencias, this.observacion).subscribe({
      next: () => {
        this.mensajeExito = 'Reporte completado con evidencias';
        this.cerrarModalCompletar();
        this.cargarReportes();
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'Error al completar el reporte.')
    });
  }

  private mostrarError(err: HttpErrorResponse, fallback: string): void {
    this.mensajeError = typeof err.error?.detail === 'string'
      ? err.error.detail
      : fallback;
    setTimeout(() => this.mensajeError = '', 5000);
  }
}
