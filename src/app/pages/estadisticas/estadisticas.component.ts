import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../services/reporte.service';

interface Stat {
  label: string;
  valor: number;
  color: string;
  bg: string;
  porcentaje: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements OnInit {
  total = 0;
  stats: Stat[] = [];

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.reporteService.obtenerResumenEstadisticas().subscribe(res => {
      this.total = res.total_reportes;

      const mapa: Record<string, { label: string; color: string; bg: string }> = {
        'Pendiente':  { label: 'Pendientes',  color: '#dc2626', bg: '#fee2e2' },
        'Aprobado':   { label: 'Aprobados',   color: '#2563eb', bg: '#dbeafe' },
        'Programado': { label: 'Programados', color: '#d97706', bg: '#fef3c7' },
        'En atención': { label: 'En atención', color: '#f59e0b', bg: '#fffbeb' },
        'Atendido':   { label: 'Atendidos',   color: '#16803c', bg: '#dcfce7' },
        'Verificado': { label: 'Verificados', color: '#065f46', bg: '#d1fae5' },
        'Rechazado':  { label: 'Rechazados',  color: '#6b7280', bg: '#f3f4f6' },
      };

      this.stats = res.por_estado.map((e: { estado: string; cantidad: number }) => {
        const m = mapa[e.estado] || { label: e.estado, color: '#6b7280', bg: '#f3f4f6' };
        return {
          label: m.label,
          valor: e.cantidad,
          color: m.color,
          bg: m.bg,
          porcentaje: this.total > 0 ? Math.round((e.cantidad / this.total) * 100) : 0
        };
      });
    });
  }
}
