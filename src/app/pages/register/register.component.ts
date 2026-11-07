import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombre = '';
  email = '';
  dni = '';
  password = '';
  confirmPassword = '';
  error = '';
  exito = false;
  cargando = false;

  constructor(private router: Router, private authService: AuthService) {}

  registrar(): void {
    this.error = '';

    if (!this.nombre || !this.email || !this.dni || !this.password || !this.confirmPassword) {
      this.error = 'Completa todos los campos.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.error = 'Ingresa un correo electrónico válido.';
      return;
    }

    if (this.dni.length !== 8 || !/^\d{8}$/.test(this.dni)) {
      this.error = 'El DNI debe tener exactamente 8 dígitos numéricos.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    this.authService.registrarUsuario(this.nombre, this.email, this.password, this.dni).subscribe(ok => {
      this.cargando = false;
      if (!ok) {
        this.error = 'Este correo electrónico o DNI ya está registrado.';
        return;
      }
      this.exito = true;
      setTimeout(() => this.router.navigate(['/verify', { email: this.email }]), 1500);
    });
  }
}
