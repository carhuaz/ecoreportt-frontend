import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuadrillaService } from '../../services/cuadrilla.service';
import { ReporteService } from '../../services/reporte.service';
import { Cuadrilla } from '../../models/cuadrilla.model';
import { Reporte } from '../../models/reporte.model';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';

@Component({
  selector: 'app-mis-cuadrillas',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeEstadoComponent, ImageUploaderComponent],
  templateUrl: './mis-cuadrillas.component.html',
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
    this.cuadrillaService.obtenerMisCuadrillas().subscribe(data => {
      this.cuadrillas = data;
      if (data.length > 0) {
        this.cuadrillaSeleccionada = data[0].id;
        this.cargarReportes();
      }
      this.cargando = false;
    });
  }

  seleccionarCuadrilla(id: number): void {
    this.cuadrillaSeleccionada = id;
    this.cargarReportes();
  }

  cargarReportes(): void {
    if (!this.cuadrillaSeleccionada) return;
    this.reporteService.obtenerReportesPorCuadrilla(this.cuadrillaSeleccionada, undefined, 1, 100).subscribe(res => {
      this.reportesPorCuadrilla[this.cuadrillaSeleccionada!] = res.items;
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
    this.reporteService.marcarEnAtencion(reporte.id, '').subscribe(ok => {
      if (ok) {
        this.mensajeExito = 'Atención iniciada';
        this.cargarReportes();
      } else {
        this.mensajeError = 'Error al iniciar atención';
      }
      setTimeout(() => { this.mensajeExito = ''; this.mensajeError = ''; }, 3000);
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
    this.reporteService.completarConEvidencias(this.reporteACompletar.id, this.evidencias, this.observacion).subscribe(ok => {
      if (ok) {
        this.mensajeExito = 'Reporte completado con evidencias';
        this.cerrarModalCompletar();
        this.cargarReportes();
      } else {
        this.mensajeError = 'Error al completar el reporte';
      }
      setTimeout(() => { this.mensajeExito = ''; this.mensajeError = ''; }, 3000);
    });
  }
}
