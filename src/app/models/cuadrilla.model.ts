export interface Cuadrilla {
  id: number;
  nombre: string;
  responsable: string;
  responsableId?: number;
  estado: 'Disponible' | 'En ruta' | 'Ocupada';
  zonaAsignada: string;
  distrito: string;
}
