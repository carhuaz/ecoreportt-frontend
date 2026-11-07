import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent {
  private apiUrl = environment.apiUrl;
  nombre = '';
  email = '';
  asunto = 'Consulta general';
  mensaje = '';
  error = '';
  codigoAtencion = '';

  constructor(private http: HttpClient) {}

  enviar(): void {
    this.error = '';
    this.codigoAtencion = '';

    if (!this.nombre.trim() || !this.email.trim() || !this.mensaje.trim()) {
      this.error = 'Completa tu nombre, correo y mensaje.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.error = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.http.post<{ codigo: string }>(`${this.apiUrl}/contacto`, {
      nombre: this.nombre.trim(),
      email: this.email.trim().toLowerCase(),
      asunto: this.asunto,
      mensaje: this.mensaje.trim()
    }).subscribe({
      next: res => {
        this.codigoAtencion = res.codigo;
        this.nombre = '';
        this.email = '';
        this.asunto = 'Consulta general';
        this.mensaje = '';
      },
      error: err => {
        this.error = err.error?.detail || 'Error al enviar el mensaje. Intenta de nuevo.';
      }
    });
  }
}
