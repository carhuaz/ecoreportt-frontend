import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Usuario, RolUsuario } from '../../models/usuario.model';
import { PaginacionComponent } from '../../shared/paginacion/paginacion.component';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginacionComponent],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  filtroNombre = '';
  filtroRol: RolUsuario | '' = '';

  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;

  readonly pageSizes = [5, 10, 20];

  rolSeleccionadoModal: RolUsuario = 'Ciudadano';
  usuarioSeleccionado: Usuario | null = null;
  mostrarModal = false;
  mostrarConfirmacion = false;
  mensaje = '';
  mensajeEsError = false;

  get desde(): number { return (this.page - 1) * this.pageSize + 1; }
  get hasta(): number { return Math.min(this.page * this.pageSize, this.total); }

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    const termino = this.filtroNombre || undefined;
    const rol = this.filtroRol || undefined;
    this.usuarioService.obtenerUsuariosPaginados(this.page, this.pageSize, termino, rol).subscribe(res => {
      this.usuarios = res.items;
      this.total = res.total;
      this.totalPages = res.total_pages;
    });
  }

  onFiltroChange(): void {
    this.page = 1;
    this.cargarUsuarios();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.cargarUsuarios();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.cargarUsuarios();
  }

  paginaSiguiente(): void { this.irPagina(this.page + 1); }
  paginaAnterior(): void { this.irPagina(this.page - 1); }

  paginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.page - 2);
    const fin = Math.min(this.totalPages, this.page + 2);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  abrirModalCambiarRol(usuario: Usuario): void {
    if (this.esUsuarioActual(usuario)) {
      this.mostrarMensaje('No puedes cambiar tu propio rol durante la sesión.', true);
      return;
    }

    this.usuarioSeleccionado = usuario;
    this.rolSeleccionadoModal = usuario.rol;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = null;
  }

  confirmarCambiarRol(): void {
    if (!this.usuarioSeleccionado) return;

    if (this.rolSeleccionadoModal === 'Administrador') {
      this.mostrarConfirmacion = true;
      return;
    }

    this.realizarCambioRol();
  }

  realizarCambioRol(): void {
    if (!this.usuarioSeleccionado) return;

    this.usuarioService.cambiarRolUsuario(
      this.usuarioSeleccionado.id,
      this.rolSeleccionadoModal
    ).subscribe(cambioExitoso => {
      this.mostrarConfirmacion = false;
      this.cerrarModal();
      this.cargarUsuarios();
      this.mostrarMensaje(
        cambioExitoso ? 'Rol actualizado correctamente.' : 'No se pudo actualizar el rol.',
        !cambioExitoso
      );
    });
  }

  cambiarEstado(usuario: Usuario): void {
    const accion$ = usuario.activo
      ? this.usuarioService.desactivarUsuario(usuario.id)
      : this.usuarioService.activarUsuario(usuario.id);

    accion$.subscribe(resultado => {
      if (resultado) {
        this.mostrarMensaje(
          usuario.activo ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.'
        );
      } else {
        this.mostrarMensaje('No puedes desactivar el usuario de la sesión actual.', true);
      }
      this.cargarUsuarios();
    });
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return this.authService.obtenerUsuarioActual()?.id === usuario.id;
  }

  private mostrarMensaje(texto: string, esError = false): void {
    this.mensaje = texto;
    this.mensajeEsError = esError;
    setTimeout(() => this.mensaje = '', 3000);
  }

  obtenerColorRol(rol: RolUsuario): string {
    switch (rol) {
      case 'Administrador': return 'role-admin';
      case 'Validador': return 'role-validador';
      case 'ResponsableCuadrilla': return 'role-cuadrilla';
      case 'Ciudadano': return 'role-ciudadano';
      default: return '';
    }
  }

  obtenerColorEstado(activo: boolean): string {
    return activo ? 'estado-activo' : 'estado-inactivo';
  }
}
