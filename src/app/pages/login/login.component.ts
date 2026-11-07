import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  exito = false;
  cargando = false;

  constructor(private authService: AuthService, private router: Router) {}

  get noVerificado(): boolean {
    return this.error === 'no_verificado';
  }

  ingresar(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Completa todos los campos.';
      return;
    }
    this.cargando = true;
    this.authService.login(this.email, this.password).subscribe(res => {
      this.cargando = false;
      if (res.ok) {
        this.exito = true;
        setTimeout(() => this.router.navigate([this.authService.obtenerRutaInicial()]), 700);
      } else if (res.noVerificado) {
        this.error = 'no_verificado';
      } else {
        this.error = 'Correo o contraseña incorrectos, o el usuario está inactivo.';
      }
    });
  }

  irAVerificar(): void {
    this.router.navigate(['/verify', { email: this.email }]);
  }
}
