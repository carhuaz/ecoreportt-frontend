import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { Reporte } from '../../models/reporte.model';
import { CardReporteComponent } from '../../shared/card-reporte/card-reporte.component';
import { EcoMapComponent } from '../../shared/eco-map/eco-map.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CardReporteComponent, EcoMapComponent, PaginacionComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  reportes: Reporte[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  totalReportes = 0;
  porEstado: { estado: string; cantidad: number }[] = [];
  porPrioridad: { prioridad: string; cantidad: number }[] = [];

  readonly pageSizes = [5, 10, 20];

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }
  get contarEstado() {
    return (estado: string) => this.porEstado.find(e => e.estado === estado)?.cantidad || 0;
  }
  get pendientes()  { return this.contarEstado('Pendiente'); }
  get programados() { return this.contarEstado('Programado'); }
  get atendidos()   { return this.contarEstado('Atendido'); }
  get criticos()    { return this.porPrioridad.find(p => p.prioridad === 'Crítica')?.cantidad || 0; }

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargar();
  }

  cargarEstadisticas(): void {
    this.reporteService.obtenerResumenEstadisticas().subscribe(res => {
      this.totalReportes = res.total_reportes;
      this.porEstado = res.por_estado;
      this.porPrioridad = res.por_prioridad;
    });
  }

  cargar(): void {
    this.reporteService.obtenerReportes({ page: this.page, page_size: this.pageSize }).subscribe(res => {
      this.reportes = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
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
}
