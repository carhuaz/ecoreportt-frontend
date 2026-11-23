import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Reporte } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';
import { EcoMapComponent } from '../../shared/eco-map/eco-map.component';

@Component({
  selector: 'app-mapa-ambiental',
  imports: [CommonModule, FormsModule, RouterLink, EcoMapComponent],
  templateUrl: './mapa-ambiental.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./mapa-ambiental.component.css']
})
export class MapaAmbientalComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  reporteActivo: Reporte | null = null;

  busqueda = '';
  filtroDistrito = '';
  filtroEstado = '';
  filtroPrioridad = '';

  distritosDisponibles: string[] = [];
  estadosDisponibles: string[] = [];
  readonly prioridadesDisponibles = ['Crítica', 'Alta', 'Media', 'Baja'];

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.reporteService.obtenerReportesPublicos({ page_size: 200 }).subscribe(res => {
      this.reportes = res.items;
      this.distritosDisponibles = Array.from(
        new Set(this.reportes.map(r => r.distrito).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      this.estadosDisponibles = Array.from(
        new Set(this.reportes.map(r => r.estado).filter(Boolean))
      );
      this.aplicarFiltros();
    });
  }

  get hayFiltrosActivos(): boolean {
    return !!(
      this.busqueda.trim() ||
      this.filtroDistrito ||
      this.filtroEstado ||
      this.filtroPrioridad
    );
  }

  aplicarFiltros(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.reportesFiltrados = this.reportes.filter(r => {
      if (this.filtroDistrito && r.distrito !== this.filtroDistrito) {
        return false;
      }
      if (this.filtroEstado && r.estado !== this.filtroEstado) {
        return false;
      }
      if (this.filtroPrioridad && r.prioridad !== this.filtroPrioridad) {
        return false;
      }
      if (texto) {
        const coincide =
          r.titulo?.toLowerCase().includes(texto) ||
          r.direccion?.toLowerCase().includes(texto) ||
          r.distrito?.toLowerCase().includes(texto);
        if (!coincide) {
          return false;
        }
      }
      return true;
    });

    if (!this.reporteActivo || !this.reportesFiltrados.some(r => r.id === this.reporteActivo?.id)) {
      this.reporteActivo =
        this.reportesFiltrados.find(
          r => r.latitud !== undefined && r.latitud !== null && r.longitud !== undefined && r.longitud !== null
        ) || null;
    }
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroDistrito = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.aplicarFiltros();
  }

  seleccionarReporte(reporte: Reporte): void {
    this.reporteActivo = reporte;
  }

  claseEstado(reporte: Reporte): string {
    if (reporte.estado === 'Aprobado') {
      return 'aprobado';
    }
    if (reporte.estado === 'Atendido' || reporte.estado === 'Verificado') {
      return 'resuelto';
    }
    return 'proceso';
  }
}
