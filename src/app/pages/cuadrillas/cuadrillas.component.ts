import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  responsable_id?: number;
  distrito: string;
  zona_asignada: string;
}

@Component({
  selector: 'app-cuadrillas',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeEstadoComponent, ModalConfirmacionComponent, PaginacionComponent],
  templateUrl: './cuadrillas.component.html',
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
    this.reporteService.obtenerReportes({ estado: 'Aprobado', page: this.page, page_size: this.pageSize }).subscribe(res => {
      this.reportesAprobados = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
    });
    this.cuadrillaService.obtenerCuadrillas().subscribe(data => {
      this.cuadrillas = data;
    });
    this.usuarioService.obtenerUsuarios().subscribe(data => {
      this.responsables = data.filter(u => u.rol === 'ResponsableCuadrilla');
    });
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.cargar();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.cargar();
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

  asignar(reporteId: number): void {
    const cuadrillaId = this.seleccion[reporteId];
    if (!cuadrillaId) return;
    this.cuadrillaService.asignarCuadrilla(reporteId, cuadrillaId).subscribe(ok => {
      if (!ok) {
        this.mensajeError = 'No se pudo asignar: la cuadrilla puede haber alcanzado el límite de asignaciones';
        setTimeout(() => this.mensajeError = null, 4000);
        return;
      }
      this.mensajeExito = 'Cuadrilla asignada correctamente';
      this.cargar();
      setTimeout(() => this.mensajeExito = null, 3000);
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

  onResponsableChange(userId: number | undefined): void {
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

    action.subscribe(ok => {
      if (!ok) {
        this.mensajeError = 'Error al guardar la cuadrilla';
        return;
      }
      this.cerrarModal();
      this.mensajeExito = this.modal.editando ? 'Cuadrilla actualizada' : 'Cuadrilla creada';
      this.cargar();
      setTimeout(() => this.mensajeExito = null, 3000);
    });
  }

  eliminarCuadrilla(c: Cuadrilla): void {
    this.cuadrillaAEliminar = c;
  }

  confirmarEliminacion(): void {
    if (!this.cuadrillaAEliminar) return;
    this.cuadrillaService.eliminarCuadrilla(this.cuadrillaAEliminar.id).subscribe(ok => {
      if (!ok) {
        this.mensajeError = 'No se puede eliminar: tiene reportes activos asignados';
        setTimeout(() => this.mensajeError = null, 4000);
        this.cuadrillaAEliminar = null;
        return;
      }
      this.mensajeExito = 'Cuadrilla eliminada';
      this.cuadrillaAEliminar = null;
      this.cargar();
      setTimeout(() => this.mensajeExito = null, 3000);
    });
  }

  cancelarEliminacion(): void {
    this.cuadrillaAEliminar = null;
  }

  get mensajeEliminar(): string {
    return `¿Estás seguro de eliminar la cuadrilla "${this.cuadrillaAEliminar?.nombre || ''}"?`;
  }
}
