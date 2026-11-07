import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { Distrito, PrioridadReporte } from '../../models/reporte.model';
import { ImageUploaderComponent } from '../../shared/image-uploader/image-uploader.component';
import { EcoMapComponent, UbicacionMapa } from '../../shared/eco-map/eco-map.component';

interface NivelPrioridad {
  nombre: PrioridadReporte;
  puntaje: number;
  icono: string;
  resumen: string;
  ejemplos: string[];
}

@Component({
  selector: 'app-reportar',
  standalone: true,
  imports: [FormsModule, CommonModule, ImageUploaderComponent, EcoMapComponent],
  templateUrl: './reportar.component.html',
  styleUrls: ['./reportar.component.css']
})
export class ReportarComponent {
  titulo = '';
  descripcion = '';
  distrito: Distrito = 'Huancayo';
  direccion = '';
  prioridad: PrioridadReporte = 'Media';
  imagenes: string[] = [];
  latitud?: number;
  longitud?: number;
  anonimo = false;
  error = '';
  exito = false;
  cargando = false;

  readonly nivelesPrioridad: NivelPrioridad[] = [
    {
      nombre: 'Baja',
      puntaje: 2,
      icono: 'bi-circle-fill',
      resumen: 'Poca cantidad y sin riesgo inmediato.',
      ejemplos: ['Una o dos bolsas', 'No bloquea el paso', 'Lejos de zonas sensibles']
    },
    {
      nombre: 'Media',
      puntaje: 6,
      icono: 'bi-exclamation-circle-fill',
      resumen: 'Acumulación moderada que requiere atención.',
      ejemplos: ['Varias bolsas', 'Malos olores leves', 'Zona transitada']
    },
    {
      nombre: 'Alta',
      puntaje: 9,
      icono: 'bi-exclamation-triangle-fill',
      resumen: 'Problema importante con impacto en vecinos.',
      ejemplos: ['Gran acumulación', 'Plagas o bloqueo', 'Cerca de viviendas o mercados']
    },
    {
      nombre: 'Crítica',
      puntaje: 13,
      icono: 'bi-radioactive',
      resumen: 'Riesgo urgente para la salud o el ambiente.',
      ejemplos: ['Residuos peligrosos', 'Contaminación de río', 'Riesgo grave o acceso bloqueado']
    }
  ];

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
    private router: Router
  ) {}

  private scrollArriba(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  enviar(): void {
    this.error = '';
    if (
      !this.titulo ||
      !this.descripcion ||
      !this.direccion ||
      this.imagenes.length === 0 ||
      this.latitud === undefined ||
      this.longitud === undefined
    ) {
      this.error = 'Completa los campos, agrega una imagen y selecciona la ubicación en el mapa.';
      this.scrollArriba();
      return;
    }

    const nivelSeleccionado = this.obtenerNivelPrioridad(this.prioridad);
    const nuevoReporte = {
      titulo: this.titulo,
      descripcion: this.descripcion,
      distrito: this.distrito,
      direccion: this.direccion,
      estado: 'Pendiente' as const,
      prioridad: this.prioridad,
      puntajePrioridad: nivelSeleccionado.puntaje,
      criteriosPrioridad: [
        `Nivel declarado por el ciudadano: ${nivelSeleccionado.resumen}`
      ],
      imagenes: this.imagenes,
      ciudadano: this.anonimo ? 'Anónimo' : (this.authService.obtenerUsuarioActual()?.nombre || 'Ciudadano'),
      latitud: this.latitud,
      longitud: this.longitud,
      anonimo: this.anonimo
    };

    this.cargando = true;
    this.reporteService.agregarReporte(nuevoReporte).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        setTimeout(() => this.router.navigate(['/mis-reportes']), 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.detail || 'Error al enviar el reporte. Intenta nuevamente.';
        this.scrollArriba();
      }
    });
  }

  onImagenesChange(imagenes: string[]): void {
    this.imagenes = imagenes;
  }

  onUbicacionChange(ubicacion: UbicacionMapa): void {
    this.latitud = ubicacion.latitud;
    this.longitud = ubicacion.longitud;
  }

  seleccionarPrioridad(prioridad: PrioridadReporte): void {
    this.prioridad = prioridad;
  }

  private obtenerNivelPrioridad(prioridad: PrioridadReporte): NivelPrioridad {
    return this.nivelesPrioridad.find(nivel => nivel.nombre === prioridad)
      || this.nivelesPrioridad[1];
  }
}
