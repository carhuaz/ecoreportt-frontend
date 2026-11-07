import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { Reporte, Distrito } from '../../models/reporte.model';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { EcoMapComponent } from '../../shared/eco-map/eco-map.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

@Component({
  selector: 'app-validacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeEstadoComponent, EcoMapComponent, PaginacionComponent],
  templateUrl: './validacion.component.html',
  styleUrls: ['./validacion.component.css']
})
export class ValidacionComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesProcesados: Reporte[] = [];

  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;
  filtroDistrito: Distrito | '' = '';

  readonly pageSizes = [5, 10, 20];

  modalVisible = false;
  accionPendiente: 'aprobar' | 'rechazar' | null = null;
  reporteSeleccionadoId: number | null = null;
  observacion = '';
  mensajeExito = '';
  mensajeError = '';
  modalDetalleVisible = false;
  reporteDetalle: Reporte | null = null;
  reportesDetalleMapa: Reporte[] = [];
  imagenDetalleSeleccionada = '';
  cargando = false;

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  get tituloModal(): string {
    return this.accionPendiente === 'aprobar' ? '¿Aprobar reporte?' : '¿Rechazar reporte?';
  }

  get mensajeModal(): string {
    return this.accionPendiente === 'aprobar'
      ? 'El reporte pasará a estado Aprobado y podrá asignarse a una cuadrilla.'
      : 'El reporte será marcado como Rechazado.';
  }

  constructor(private reporteService: ReporteService, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarProcesados();
  }

  cargarPendientes(): void {
    this.reporteService.obtenerReportes({
      estado: 'Pendiente',
      page: this.page,
      page_size: this.pageSize,
      distrito: this.filtroDistrito || undefined
    }).subscribe(res => {
      this.reportes = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
    });
  }

  cargarProcesados(): void {
    this.reporteService.obtenerReportes({ page_size: 200 }).subscribe(res => {
      this.reportesProcesados = res.items
        .filter(r => r.estado === 'Aprobado' || r.estado === 'Rechazado')
        .reverse();
    });
  }

  onFiltroDistritoChange(): void {
    this.page = 1;
    this.cargarPendientes();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.cargarPendientes();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.cargarPendientes();
  }

  paginaSiguiente(): void { this.irPagina(this.page + 1); }
  paginaAnterior(): void { this.irPagina(this.page - 1); }

  paginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.page - 2);
    const fin = Math.min(this.totalPages, this.page + 2);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  confirmarAccion(id: number, accion: 'aprobar' | 'rechazar'): void {
    this.cerrarDetalle();
    this.reporteSeleccionadoId = id;
    this.accionPendiente = accion;
    this.observacion = '';
    this.modalVisible = true;
  }

  ejecutarAccion(): void {
    if (this.reporteSeleccionadoId === null) return;

    this.mensajeError = '';
    if (this.accionPendiente === 'rechazar' && !this.observacion.trim()) {
      this.mensajeError = 'Indica el motivo del rechazo antes de continuar.';
      return;
    }

    const validador = this.authService.obtenerUsuarioActual()?.nombre || 'Validador';
    this.cargando = true;

    const accion$ = this.accionPendiente === 'aprobar'
      ? this.reporteService.aprobarReporte(this.reporteSeleccionadoId, this.observacion || 'Reporte aprobado', validador)
      : this.reporteService.rechazarReporte(this.reporteSeleccionadoId, this.observacion, validador);

    accion$.subscribe(exito => {
      this.cargando = false;
      if (exito) {
        this.mensajeExito = this.accionPendiente === 'aprobar'
          ? 'Reporte aprobado correctamente.'
          : 'Reporte rechazado correctamente.';
        setTimeout(() => this.mensajeExito = '', 3000);
      }
      this.cerrarModal();
      this.cargarPendientes();
      this.cargarProcesados();
    });
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.accionPendiente = null;
    this.reporteSeleccionadoId = null;
    this.observacion = '';
    this.mensajeError = '';
  }

  abrirDetalle(reporte: Reporte): void {
    this.reporteDetalle = reporte;
    this.reportesDetalleMapa = [reporte];
    this.imagenDetalleSeleccionada = reporte.imagenes?.[0] || '/images/reporte-basura-calle.jpg';
    this.modalDetalleVisible = true;
  }

  cerrarDetalle(): void {
    this.modalDetalleVisible = false;
    this.reporteDetalle = null;
    this.reportesDetalleMapa = [];
    this.imagenDetalleSeleccionada = '';
  }

  seleccionarImagen(imagen: string): void {
    this.imagenDetalleSeleccionada = imagen;
  }
}
