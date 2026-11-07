import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { CuadrillaService } from '../../services/cuadrilla.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';
import { Cuadrilla } from '../../models/cuadrilla.model';

interface EvidenciaItem {
  id: number;
  titulo: string;
  descripcion: string;
  distrito: string;
  estado: string;
  fecha: string;
  cuadrilla_id: number;
  cuadrilla_nombre: string;
  imagenes?: string[];
  observacion_completado?: string;
}

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeEstadoComponent, PaginacionComponent],
  templateUrl: './admin-auditoria.component.html',
  styleUrls: ['./admin-auditoria.component.css']
})
export class AdminAuditoriaComponent implements OnInit {
  items: EvidenciaItem[] = [];
  cuadrillas: Cuadrilla[] = [];

  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;

  readonly pageSizes = [5, 10, 20];

  filtroCuadrilla = '';
  filtroEstado = '';

  modalDetalleVisible = false;
  itemDetalle: EvidenciaItem | null = null;
  imagenDetalleSeleccionada = '';

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  constructor(
    private reporteService: ReporteService,
    private cuadrillaService: CuadrillaService
  ) {}

  ngOnInit(): void {
    this.cargarCuadrillas();
    this.cargar();
  }

  cargarCuadrillas(): void {
    this.cuadrillaService.obtenerCuadrillas().subscribe(data => {
      this.cuadrillas = data;
    });
  }

  cargar(): void {
    const cuadrillaId = this.filtroCuadrilla ? Number(this.filtroCuadrilla) : undefined;
    const estado = this.filtroEstado || undefined;
    this.reporteService.obtenerAuditoriaEvidencias(this.page, this.pageSize, cuadrillaId, estado).subscribe(res => {
      this.items = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
    });
  }

  onFiltroChange(): void {
    this.page = 1;
    this.cargar();
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

  abrirDetalle(item: EvidenciaItem): void {
    this.itemDetalle = item;
    this.imagenDetalleSeleccionada = item.imagenes?.[0] || '';
    this.modalDetalleVisible = true;
  }

  cerrarDetalle(): void {
    this.modalDetalleVisible = false;
    this.itemDetalle = null;
    this.imagenDetalleSeleccionada = '';
  }

  seleccionarImagen(imagen: string): void {
    this.imagenDetalleSeleccionada = imagen;
  }
}
