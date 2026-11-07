import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReporteService } from '../../services/reporte.service';
import { Reporte } from '../../models/reporte.model';
import { CardReporteComponent } from '../../shared/card-reporte/card-reporte.component';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

@Component({
  selector: 'app-mis-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardReporteComponent, PaginacionComponent],
  templateUrl: './mis-reportes.component.html',
  styleUrls: ['./mis-reportes.component.css']
})
export class MisReportesComponent implements OnInit {
  reportes: Reporte[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  readonly pageSizes = [5, 10, 20];

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  constructor(
    private reporteService: ReporteService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.reporteService.obtenerReportesPorCiudadano(this.page, this.pageSize).subscribe(res => {
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
