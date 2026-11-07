import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import { Reporte } from '../../models/reporte.model';

export interface UbicacionMapa {
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-eco-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eco-map.component.html',
  styleUrls: ['./eco-map.component.css']
})
export class EcoMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private mapContainer!: ElementRef<HTMLDivElement>;

  @Input() reportes: Reporte[] = [];
  @Input() seleccionable = false;
  @Input() latitud?: number;
  @Input() longitud?: number;
  @Input() altura = '480px';

  @Output() ubicacionChange = new EventEmitter<UbicacionMapa>();
  @Output() reporteSeleccionado = new EventEmitter<Reporte>();

  mensajeUbicacion = '';
  buscandoUbicacion = false;

  private mapa?: L.Map;
  private capaReportes = L.layerGroup();
  private marcadorSeleccion?: L.CircleMarker;
  private resizeObserver?: ResizeObserver;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.mapa = L.map(this.mapContainer.nativeElement, {
      center: [-12.0651, -75.2049],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);

    L.control.scale({ imperial: false }).addTo(this.mapa);
    this.capaReportes.addTo(this.mapa);

    if (this.seleccionable) {
      this.mapa.on('click', evento => {
        this.establecerUbicacion(evento.latlng.lat, evento.latlng.lng, true);
      });
    }

    this.renderizarReportes();
    this.renderizarSeleccion();
    this.observarCambiosDeTamano();
    this.actualizarTamanoMapa();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapa) {
      return;
    }

    if (changes['reportes']) {
      this.renderizarReportes();
    }

    if (changes['latitud'] || changes['longitud']) {
      this.renderizarSeleccion();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.actualizarTamanoMapa);
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.mapa?.remove();
  }

  usarMiUbicacion(): void {
    this.mensajeUbicacion = '';

    if (!navigator.geolocation) {
      this.mensajeUbicacion = 'Tu navegador no admite geolocalización.';
      return;
    }

    this.buscandoUbicacion = true;
    navigator.geolocation.getCurrentPosition(
      posicion => {
        this.buscandoUbicacion = false;
        this.establecerUbicacion(
          posicion.coords.latitude,
          posicion.coords.longitude,
          true
        );
        this.mapa?.setView(
          [posicion.coords.latitude, posicion.coords.longitude],
          17
        );
      },
      () => {
        this.buscandoUbicacion = false;
        this.mensajeUbicacion = 'No se pudo obtener tu ubicación. Selecciónala en el mapa.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private renderizarReportes(): void {
    if (!this.mapa) {
      return;
    }

    this.capaReportes.clearLayers();
    const limites: L.LatLngExpression[] = [];

    this.reportes.forEach(reporte => {
      if (reporte.latitud === undefined || reporte.longitud === undefined) {
        return;
      }

      const coordenadas: L.LatLngExpression = [reporte.latitud, reporte.longitud];
      const marcador = L.circleMarker(coordenadas, {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: this.obtenerColorEstado(reporte),
        fillOpacity: 1
      });

      marcador.bindPopup(this.crearContenidoPopup(reporte));
      marcador.on('click', () => this.reporteSeleccionado.emit(reporte));
      marcador.addTo(this.capaReportes);
      limites.push(coordenadas);
    });

    if (limites.length > 0 && !this.seleccionable) {
      this.mapa.fitBounds(L.latLngBounds(limites), {
        padding: [35, 35],
        maxZoom: 15
      });
    }
  }

  private observarCambiosDeTamano(): void {
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', this.actualizarTamanoMapa);
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }

      this.resizeTimer = setTimeout(() => this.actualizarTamanoMapa(), 80);
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  private actualizarTamanoMapa = (): void => {
    requestAnimationFrame(() => {
      this.mapa?.invalidateSize({ pan: false, debounceMoveend: true });
    });
  };

  private renderizarSeleccion(): void {
    if (!this.mapa) {
      return;
    }

    if (this.latitud === undefined || this.longitud === undefined) {
      this.marcadorSeleccion?.remove();
      this.marcadorSeleccion = undefined;
      return;
    }

    this.establecerUbicacion(this.latitud, this.longitud, false);
  }

  private establecerUbicacion(latitud: number, longitud: number, emitir: boolean): void {
    if (!this.mapa) {
      return;
    }

    if (!this.marcadorSeleccion) {
      this.marcadorSeleccion = L.circleMarker([latitud, longitud], {
        radius: 11,
        color: '#14532d',
        weight: 4,
        fillColor: '#22c55e',
        fillOpacity: 1
      }).addTo(this.mapa);
      this.marcadorSeleccion.bindTooltip('Ubicación seleccionada', {
        permanent: false,
        direction: 'top'
      });
    } else {
      this.marcadorSeleccion.setLatLng([latitud, longitud]);
    }

    if (emitir) {
      this.ubicacionChange.emit({ latitud, longitud });
      this.mensajeUbicacion = 'Ubicación seleccionada correctamente.';
    }
  }

  private obtenerColorEstado(reporte: Reporte): string {
    switch (reporte.estado) {
      case 'Pendiente':
        return '#dc2626';
      case 'Aprobado':
        return '#2563eb';
      case 'Programado':
      case 'En atención':
        return '#f59e0b';
      case 'Atendido':
      case 'Verificado':
        return '#16a34a';
      case 'Rechazado':
        return '#6b7280';
    }
  }

  private crearContenidoPopup(reporte: Reporte): HTMLElement {
    const contenedor = document.createElement('div');
    const titulo = document.createElement('strong');
    const detalle = document.createElement('p');
    const estado = document.createElement('small');

    titulo.textContent = reporte.titulo;
    detalle.textContent = `${reporte.distrito} · ${reporte.direccion}`;
    estado.textContent = `${reporte.estado} · Prioridad ${reporte.prioridad}`;

    detalle.style.margin = '6px 0';
    estado.style.color = '#64748b';

    contenedor.append(titulo, detalle, estado);
    return contenedor;
  }
}
