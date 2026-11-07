import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reporte } from '../../models/reporte.model';
import { BadgeEstadoComponent } from '../badge-estado/badge-estado.component';

@Component({
  selector: 'app-card-reporte',
  standalone: true,
  imports: [CommonModule, BadgeEstadoComponent],
  templateUrl: './card-reporte.component.html',
  styleUrls: ['./card-reporte.component.css']
})
export class CardReporteComponent {
  @Input() reporte!: Reporte;

  get imagenSrc(): string {
    return (this.reporte.imagenes && this.reporte.imagenes.length > 0) 
      ? this.reporte.imagenes[0] 
      : '/images/reporte-basura-calle.jpg';
  }

  get prioridadClase(): string {
    return this.reporte.prioridad.toLowerCase() || 'media';
  }
}
