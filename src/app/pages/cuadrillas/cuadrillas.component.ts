import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { CuadrillaService } from '../../services/cuadrilla.service';
import { UsuarioService } from '../../services/usuario.service';
import { Reporte } from '../../models/reporte.model';
import { Cuadrilla } from '../../models/cuadrilla.model';
import { Usuario } from '../../models/usuario.model';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { ModalConfirmacionComponent } from '../../shared/modal-confirmacion/modal-confirmacion.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

interface ModalCuadrilla {
  abierto: boolean;
  editando: boolean;
  id?: number;
  nombre: string;
  responsable: string;
  responsable_id?: number | null;
  distrito: string;
  zona_asignada: string;
}

@Component({
    selector: 'app-cuadrillas',
    imports: [FormsModule, BadgeEstadoComponent, ModalConfirmacionComponent, PaginacionComponent],
    templateUrl: './cuadrillas.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./cuadrillas.component.css']
})
export class CuadrillasComponent implements OnInit {
  reportesAprobados: Reporte[] = [];
  cuadrillas: Cuadrilla[] = [];
  responsables: Usuario[] = [];
  seleccion: { [reporteId: number]: number } = {};
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  modal: ModalCuadrilla = { abierto: false, editando: false, nombre: '', responsable: '', distrito: 'Huancayo', zona_asignada: '' };
  cuadrillaAEliminar: Cuadrilla | null = null;

  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  readonly pageSizes = [5, 10, 20];

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  constructor(
    private reporteService: ReporteService,
    private cuadrillaService: CuadrillaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargarReportes();
    this.cargarCuadrillas();
    this.cargarResponsables();
  }

  cargarReportes(): void {
    this.reporteService.obtenerReportes({ estado: 'Aprobado', page: this.page, page_size: this.pageSize }).subscribe({
      next: res => {
        this.reportesAprobados = res.items;
        this.total = res.total;
        this.totalPages = res.total_pages;
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'No se pudieron cargar los reportes aprobados.')
    });
  }

  cargarCuadrillas(): void {
    this.cuadrillaService.obtenerCuadrillas().subscribe({
      next: data => {
        this.cuadrillas = data;
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'No se pudieron cargar las cuadrillas.')
    });
  }

  cargarResponsables(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: data => {
        this.responsables = data.filter(u => u.rol === 'ResponsableCuadrilla');
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'No se pudieron cargar los responsables.')
    });
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.cargarReportes();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.cargarReportes();
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

  private mostrarError(err: HttpErrorResponse, fallback: string): void {
    this.mensajeError = typeof err.error?.detail === 'string'
      ? err.error.detail
      : fallback;
    setTimeout(() => this.mensajeError = null, 5000);
  }

  asignar(reporteId: number): void {
    const cuadrillaId = this.seleccion[reporteId];
    if (!cuadrillaId) return;
    this.mensajeError = null;
    this.cuadrillaService.asignarCuadrilla(reporteId, cuadrillaId).subscribe({
      next: () => {
        this.mensajeExito = 'Cuadrilla asignada correctamente';
        this.cargarReportes();
        this.cargarCuadrillas();
        setTimeout(() => this.mensajeExito = null, 3000);
      },
      error: (err: HttpErrorResponse) => this.mostrarError(
        err,
        'No se pudo asignar: la cuadrilla puede haber alcanzado el límite de asignaciones'
      )
    });
  }

  abrirModalNueva(): void {
    this.modal = { abierto: true, editando: false, nombre: '', responsable: '', responsable_id: undefined, distrito: 'Huancayo', zona_asignada: '' };
  }

  abrirModalEditar(c: Cuadrilla): void {
    this.modal = {
      abierto: true, editando: true, id: c.id,
      nombre: c.nombre,
      responsable: c.responsable,
      responsable_id: c.responsableId,
      distrito: c.distrito,
      zona_asignada: c.zonaAsignada || ''
    };
  }

  cerrarModal(): void {
    this.modal.abierto = false;
  }

  onResponsableChange(userId: number | null | undefined): void {
    this.modal.responsable_id = userId;
    const user = this.responsables.find(u => u.id === userId);
    if (user) {
      this.modal.responsable = user.nombre;
    }
  }

  guardarCuadrilla(): void {
    this.mensajeError = null;
    if (!this.modal.nombre || !this.modal.responsable) {
      this.mensajeError = 'Nombre y responsable son obligatorios';
      return;
    }
    const data = {
      nombre: this.modal.nombre,
      responsable: this.modal.responsable,
      distrito: this.modal.distrito,
      zona_asignada: this.modal.zona_asignada,
      responsable_id: this.modal.responsable_id
    };

    const action = this.modal.editando
      ? this.cuadrillaService.actualizarCuadrilla(this.modal.id!, data)
      : this.cuadrillaService.crearCuadrilla(data);

    action.subscribe({
      next: () => {
        this.cerrarModal();
        this.mensajeExito = this.modal.editando ? 'Cuadrilla actualizada' : 'Cuadrilla creada';
        this.cargarCuadrillas();
        setTimeout(() => this.mensajeExito = null, 3000);
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'Error al guardar la cuadrilla.')
    });
  }

  eliminarCuadrilla(c: Cuadrilla): void {
    this.cuadrillaAEliminar = c;
  }

  confirmarEliminacion(): void {
    if (!this.cuadrillaAEliminar) return;
    this.mensajeError = null;
    this.cuadrillaService.eliminarCuadrilla(this.cuadrillaAEliminar.id).subscribe({
      next: () => {
        this.mensajeExito = 'Cuadrilla eliminada';
        this.cuadrillaAEliminar = null;
        this.cargarCuadrillas();
        setTimeout(() => this.mensajeExito = null, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.cuadrillaAEliminar = null;
        this.mostrarError(err, 'No se puede eliminar: tiene reportes activos asignados.');
      }
    });
  }

  cancelarEliminacion(): void {
    this.cuadrillaAEliminar = null;
  }

  get mensajeEliminar(): string {
    return `¿Estás seguro de eliminar la cuadrilla "${this.cuadrillaAEliminar?.nombre || ''}"?`;
  }
}
