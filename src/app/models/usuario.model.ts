export type RolUsuario = 'Ciudadano' | 'Validador' | 'Administrador' | 'ResponsableCuadrilla';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  activo: boolean;
  fechaRegistro: string;
}
