import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Distrito, EstadoReporte, Reporte } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

@Component({
  selector: 'app-reportes-publicos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BadgeEstadoComponent, PaginacionComponent],
  templateUrl: './reportes-publicos.component.html',
  styleUrls: ['./reportes-publicos.component.css']
})
export class ReportesPublicosComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  distritoFiltro: Distrito | '' = '';
  estadoFiltro: EstadoReporte | '' = '';

  page = 1;
  pageSize = 12;
  total = 0;
  totalPages = 0;

  readonly pageSizes = [5, 10, 20];

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.reporteService.obtenerReportesPublicos({
      page: this.page,
      page_size: this.pageSize,
      distrito: this.distritoFiltro || undefined,
      estado: this.estadoFiltro || undefined
    }).subscribe(res => {
      this.reportes = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
      this.aplicarFiltros();
    });
  }

  aplicarFiltros(): void {
    this.reportesFiltrados = this.reportes.filter(reporte =>
      (!this.distritoFiltro || reporte.distrito === this.distritoFiltro) &&
      (!this.estadoFiltro || reporte.estado === this.estadoFiltro)
    );
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
}
