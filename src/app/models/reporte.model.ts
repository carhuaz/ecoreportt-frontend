export type EstadoReporte =
  | 'Pendiente'
  | 'Aprobado'
  | 'Rechazado'
  | 'Programado'
  | 'En atención'
  | 'Atendido'
  | 'Verificado';

export type PrioridadReporte = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type Distrito = 'Huancayo' | 'El Tambo' | 'Chilca';

export interface HistorialReporte {
  fecha: string;
  accion: string;
  usuario: string;
  observacion?: string;
}

export interface Reporte {
  id: number;
  titulo: string;
  descripcion: string;
  distrito: Distrito;
  direccion: string;
  estado: EstadoReporte;
  prioridad: PrioridadReporte;
  puntajePrioridad: number;
  criteriosPrioridad: string[];
  prioridadCorregida?: boolean;
  observacionPrioridad?: string;
  fecha: string;
  latitud?: number;
  longitud?: number;
  imagenes: string[];
  ciudadano?: string;
  observacionValidacion?: string;
  cuadrillaAsignada?: string;
  historial?: HistorialReporte[];
}
