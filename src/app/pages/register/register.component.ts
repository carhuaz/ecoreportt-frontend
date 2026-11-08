import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  validate
} from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';

interface RegisterModel {
  nombre: string;
  email: string;
  dni: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly registerModel = signal<RegisterModel>({
    nombre: '',
    email: '',
    dni: '',
    password: '',
    confirmPassword: ''
  });

  readonly registerForm = form(this.registerModel, path => {
    required(path.nombre, { message: 'Ingresa tu nombre completo.' });

    required(path.email, { message: 'Ingresa tu correo.' });
    email(path.email, { message: 'Ingresa un correo válido.' });

    required(path.dni, { message: 'Ingresa tu DNI.' });
    maxLength(path.dni, 8, { message: 'El DNI debe tener exactamente 8 dígitos.' });
    pattern(path.dni, /^\d{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos.' });

    required(path.password, { message: 'Ingresa una contraseña.' });
    minLength(path.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres.' });

    required(path.confirmPassword, { message: 'Confirma tu contraseña.' });
    validate(path.confirmPassword, ({ value, valueOf }) => {
      if (value() !== valueOf(path.password)) {
        return {
          kind: 'passwordMismatch',
          message: 'Las contraseñas no coinciden.'
        };
      }
      return null;
    });
  }, {
    submission: {
      action: async () => {
        this.serverError.set('');

        const { nombre, email, dni, password } = this.registerModel();
        const res = await firstValueFrom(
          this.authService.registrarUsuario(nombre, email, password, dni)
        );

        if (!res.ok) {
          this.serverError.set(res.mensaje || 'No se pudo registrar la cuenta.');
          return;
        }

        this.exito.set(true);
        setTimeout(() => this.router.navigate(['/verify', { email, cooldown: 60 }]), 1500);
      }
    }
  });

  readonly serverError = signal('');
  readonly exito = signal(false);
}
