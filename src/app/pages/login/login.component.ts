import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly loginModel = signal<LoginModel>({
    email: '',
    password: ''
  });

  readonly loginForm = form(this.loginModel, path => {
    required(path.email, { message: 'Ingresa tu correo.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
  }, {
    submission: {
      action: async () => {
        this.serverError.set('');
        this.noVerificado.set(false);

        const { email, password } = this.loginModel();
        const res = await firstValueFrom(this.authService.login(email, password));

        if (!res.ok) {
          if (res.noVerificado) {
            this.noVerificado.set(true);
            return;
          }
          this.serverError.set(
            res.mensaje || 'Correo o contraseña incorrectos, o el usuario está inactivo.'
          );
          return;
        }

        this.exito.set(true);
        setTimeout(() => this.router.navigate([this.authService.obtenerRutaInicial()]), 700);
      }
    }
  });

  readonly serverError = signal('');
  readonly noVerificado = signal(false);
  readonly exito = signal(false);

  irAVerificar(): void {
    this.router.navigate(['/verify', { email: this.loginModel().email }]);
  }
}
