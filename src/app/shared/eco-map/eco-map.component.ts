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
  ViewChild,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { Reporte } from '../../models/reporte.model';

export interface UbicacionMapa {
  latitud: number;
  longitud: number;
}

const DEFAULT_MAPBOX_TOKEN = [
  'pk',
  'eyJ1IjoiNzA0NzIyNzQiLCJhIjoiY213bGxuMTB0MGcxYjJ5cHYzY2NvczM4NCJ9',
  '9WkokRCg8FtddYcsh6mbvg'
].join('.');

@Component({
  selector: 'app-eco-map',
  imports: [],
  templateUrl: './eco-map.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./eco-map.component.css']
})
export class EcoMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private http = inject(HttpClient);

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

  private mapa?: mapboxgl.Map;
  private marcadoresReportes: mapboxgl.Marker[] = [];
  private marcadorSeleccion?: mapboxgl.Marker;
  private resizeObserver?: ResizeObserver;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private mapaCargado = false;

  ngAfterViewInit(): void {
    const token =
      environment.mapboxToken ||
      (window as any).MAPBOX_TOKEN ||
      DEFAULT_MAPBOX_TOKEN;

    const mapboxWithProps = mapboxgl as typeof mapboxgl & {
      accessToken: string;
      workerUrl?: string;
    };
    mapboxWithProps.accessToken = token;
    mapboxWithProps.workerUrl = '/assets/mapbox-gl-csp-worker.js';

    const latInit = Number(this.latitud);
    const lngInit = Number(this.longitud);
    const hasInitialCoords =
      this.latitud !== undefined &&
      this.latitud !== null &&
      this.longitud !== undefined &&
      this.longitud !== null &&
      Number.isFinite(latInit) &&
      Number.isFinite(lngInit) &&
      !(latInit === 0 && lngInit === 0);

    const centroInicial: [number, number] = hasInitialCoords
      ? [lngInit, latInit]
      : [-75.2049, -12.0651]; // Huancayo centro [lng, lat]

    this.mapa = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: centroInicial,
      zoom: 14,
      pitch: 50, // Inclinación 3D estilo Rappi
      bearing: -15,
      antialias: true
    });

    // Control de navegación con soporte para visualización de pitch 3D
    this.mapa.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    this.mapa.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    this.mapa.on('style.load', () => {
      this.agregarCapaEdificios3D();
      this.mapa?.resize();
    });

    this.mapa.on('load', () => {
      this.mapaCargado = true;
      this.mapa?.resize();
      this.renderizarReportes();
      this.renderizarSeleccion();
    });

    this.mapa.on('error', err => {
      console.warn('Mapbox warning/error:', err?.error?.message || err);
    });

    requestAnimationFrame(() => this.mapa?.resize());
    setTimeout(() => this.mapa?.resize(), 150);
    setTimeout(() => this.mapa?.resize(), 600);
    setTimeout(() => this.mapa?.resize(), 1500);

    if (this.seleccionable) {
      this.mapa.on('click', evento => {
        this.establecerUbicacion(evento.lngLat.lat, evento.lngLat.lng, true);
      });
    }

    this.observarCambiosDeTamano();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapa || !this.mapaCargado) {
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
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.limpiarMarcadores();
    this.marcadorSeleccion?.remove();
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
        const lat = posicion.coords.latitude;
        const lng = posicion.coords.longitude;

        this.establecerUbicacion(lat, lng, true);

        this.mapa?.flyTo({
          center: [lng, lat],
          zoom: 16.5,
          pitch: 55,
          duration: 1800,
          essential: true
        });
      },
      () => {
        this.buscandoUbicacion = false;
        this.mensajeUbicacion = 'No se pudo obtener tu ubicación. Selecciónala en el mapa.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private agregarCapaEdificios3D(): void {
    if (!this.mapa) {
      return;
    }

    const layers = this.mapa.getStyle().layers;
    const labelLayerId = layers?.find(l => l.type === 'symbol' && l.layout?.['text-field'])?.id;

    if (!this.mapa.getLayer('add-3d-buildings')) {
      this.mapa.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#d1d5db',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.75
          }
        },
        labelLayerId
      );
    }
  }

  private renderizarReportes(): void {
    if (!this.mapa) {
      return;
    }

    this.limpiarMarcadores();

    if (this.reportes.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    let hayPuntosValidos = false;

    this.reportes.forEach(reporte => {
      const lat = Number(reporte.latitud);
      const lng = Number(reporte.longitud);
      if (
        reporte.latitud === undefined ||
        reporte.latitud === null ||
        reporte.longitud === undefined ||
        reporte.longitud === null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180 ||
        (lat === 0 && lng === 0)
      ) {
        return;
      }

      const color = this.obtenerColorEstado(reporte);
      const wrapper = document.createElement('div');
      const el = document.createElement('div');
      el.className = 'eco-pin-3d';
      el.style.backgroundColor = color;
      el.style.boxShadow = `0 0 12px ${color}88`;
      wrapper.appendChild(el);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setDOMContent(
        this.crearContenidoPopup(reporte)
      );

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.mapa!);

      wrapper.addEventListener('click', () => {
        this.reporteSeleccionado.emit(reporte);
      });

      this.marcadoresReportes.push(marker);
      bounds.extend([lng, lat]);
      hayPuntosValidos = true;
    });

    if (hayPuntosValidos && !this.seleccionable) {
      if (this.marcadoresReportes.length === 1) {
        const unico = this.marcadoresReportes[0].getLngLat();
        this.mapa.flyTo({
          center: [unico.lng, unico.lat],
          zoom: 15.5,
          pitch: 50,
          duration: 1000
        });
      } else if (this.marcadoresReportes.length > 1) {
        this.mapa.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15.5,
          pitch: 50,
          duration: 1200
        });
      }
    }
  }

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
      const wrapper = document.createElement('div');
      const pin = document.createElement('div');
      pin.className = 'eco-pin-seleccion';
      pin.innerHTML = '<i class="bi bi-geo-alt-fill"></i>';
      wrapper.appendChild(pin);

      this.marcadorSeleccion = new mapboxgl.Marker({
        element: wrapper,
        anchor: 'bottom',
        draggable: this.seleccionable
      })
        .setLngLat([longitud, latitud])
        .addTo(this.mapa);

      if (this.seleccionable) {
        this.marcadorSeleccion.on('dragend', () => {
          const lngLat = this.marcadorSeleccion!.getLngLat();
          this.ubicacionChange.emit({ latitud: lngLat.lat, longitud: lngLat.lng });
          this.mensajeUbicacion = 'Ubicación ajustada correctamente.';
        });
      }
    } else {
      this.marcadorSeleccion.setLngLat([longitud, latitud]);
    }

    if (emitir) {
      this.ubicacionChange.emit({ latitud, longitud });
      this.mensajeUbicacion = 'Ubicación seleccionada en el mapa.';
    }
  }

  private limpiarMarcadores(): void {
    this.marcadoresReportes.forEach(m => m.remove());
    this.marcadoresReportes = [];
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
    this.mapa?.resize();
  };

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
      default:
        return '#6b7280';
    }
  }

  private crearContenidoPopup(reporte: Reporte): HTMLElement {
    const contenedor = document.createElement('div');
    contenedor.className = 'eco-popup-3d';

    const titulo = document.createElement('h4');
    titulo.textContent = reporte.titulo;

    const detalle = document.createElement('p');
    detalle.textContent = `${reporte.distrito} · ${reporte.direccion || 'Sin dirección exacta'}`;

    const estado = document.createElement('span');
    estado.className = 'eco-popup-badge';
    estado.textContent = `${reporte.estado} · Prioridad ${reporte.prioridad}`;

    contenedor.append(titulo, detalle, estado);
    return contenedor;
  }
}
