import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

interface BitacoraItem {
  id: number;
  reporte_id: number;
  fecha: string;
  accion: string;
  usuario_id: number;
  validador_nombre: string;
  observacion?: string;
  titulo: string;
  distrito: string;
  prioridad: string;
  estado_reporte: string;
  imagenes?: string[];
}

@Component({
  selector: 'app-admin-auditoria',
  imports: [FormsModule, BadgeEstadoComponent, PaginacionComponent],
  templateUrl: './admin-auditoria.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./admin-auditoria.component.css']
})
export class AdminAuditoriaComponent implements OnInit {
  tabActiva: 'evidencias' | 'bitacora' = 'evidencias';

  // Pestaña 1: Evidencias de Campo
  items: EvidenciaItem[] = [];
  cuadrillas: Cuadrilla[] = [];
  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;
  readonly pageSizes = [5, 10, 20];

  filtroCuadrilla = '';
  filtroEstado = '';
  busquedaEvidencias = '';

  // Pestaña 2: Bitácora de Acciones de Usuarios
  bitacora: BitacoraItem[] = [];
  pageBitacora = 1;
  pageSizeBitacora = 50;
  totalBitacora = 0;
  totalPagesBitacora = 0;
  busquedaBitacora = '';
  filtroAccion = '';

  // Modal de detalle
  modalDetalleVisible = false;
  itemDetalle: EvidenciaItem | null = null;
  imagenDetalleSeleccionada = '';

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  get itemsFiltrados(): EvidenciaItem[] {
    const q = this.busquedaEvidencias.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(i =>
      i.titulo?.toLowerCase().includes(q) ||
      i.distrito?.toLowerCase().includes(q) ||
      i.cuadrilla_nombre?.toLowerCase().includes(q)
    );
  }

  get bitacoraFiltrada(): BitacoraItem[] {
    const q = this.busquedaBitacora.trim().toLowerCase();
    return this.bitacora.filter(b => {
      if (this.filtroAccion && b.accion !== this.filtroAccion) {
        return false;
      }
      if (!q) return true;
      return (
        b.validador_nombre?.toLowerCase().includes(q) ||
        b.titulo?.toLowerCase().includes(q) ||
        b.distrito?.toLowerCase().includes(q) ||
        (b.observacion || '').toLowerCase().includes(q)
      );
    });
  }

  get totalAtendidosVista(): number {
    return this.items.filter(i => i.estado === 'Atendido').length;
  }

  get totalVerificadosVista(): number {
    return this.items.filter(i => i.estado === 'Verificado').length;
  }

  get totalConEvidenciasVista(): number {
    return this.items.filter(i => (i.imagenes?.length ?? 0) > 0).length;
  }

  constructor(
    private reporteService: ReporteService,
    private cuadrillaService: CuadrillaService
  ) {}

  ngOnInit(): void {
    this.cargarCuadrillas();
    this.cargar();
    this.cargarBitacora();
  }

  cambiarTab(tab: 'evidencias' | 'bitacora'): void {
    this.tabActiva = tab;
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

  cargarBitacora(): void {
    this.reporteService.obtenerAuditoriaValidaciones(this.pageBitacora, this.pageSizeBitacora).subscribe(res => {
      this.bitacora = res.items;
      this.totalBitacora = res.total;
      this.totalPagesBitacora = res.total_pages;
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

  irPaginaBitacora(p: number): void {
    if (p < 1 || p > this.totalPagesBitacora) return;
    this.pageBitacora = p;
    this.cargarBitacora();
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

  exportarCsv(): void {
    const escapar = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'auditoria_ecoreport.csv';

    if (this.tabActiva === 'evidencias') {
      headers = ['ID', 'Reporte', 'Cuadrilla', 'Distrito', 'Estado', 'Evidencias', 'Fecha', 'Observacion'];
      rows = this.itemsFiltrados.map(i => [
        String(i.id),
        i.titulo,
        i.cuadrilla_nombre || 'Sin asignar',
        i.distrito,
        i.estado,
        String(i.imagenes?.length ?? 0),
        i.fecha,
        i.observacion_completado || ''
      ]);
      filename = 'auditoria_evidencias_ecoreport.csv';
    } else {
      headers = ['ID', 'Fecha', 'Usuario', 'Accion', 'Reporte ID', 'Titulo', 'Distrito', 'Prioridad', 'Observacion'];
      rows = this.bitacoraFiltrada.map(b => [
        String(b.id),
        b.fecha,
        b.validador_nombre,
        b.accion,
        String(b.reporte_id),
        b.titulo,
        b.distrito,
        b.prioridad,
        b.observacion || ''
      ]);
      filename = 'bitacora_acciones_ecoreport.csv';
    }

    const csvContent =
      '\uFEFF' +
      [headers.map(escapar).join(','), ...rows.map(r => r.map(escapar).join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
