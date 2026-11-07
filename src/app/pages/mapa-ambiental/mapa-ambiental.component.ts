import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reporte } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';
import { EcoMapComponent } from '../../shared/eco-map/eco-map.component';

@Component({
  selector: 'app-mapa-ambiental',
  standalone: true,
  imports: [CommonModule, RouterLink, EcoMapComponent],
  templateUrl: './mapa-ambiental.component.html',
  styleUrls: ['./mapa-ambiental.component.css']
})
export class MapaAmbientalComponent implements OnInit {
  reportes: Reporte[] = [];
  reporteActivo: Reporte | null = null;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.reporteService.obtenerReportesPublicos({ page_size: 200 }).subscribe(res => {
      this.reportes = res.items;
      this.reporteActivo = this.reportes.find(
        reporte => reporte.latitud !== undefined && reporte.longitud !== undefined
      ) || null;
    });
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
