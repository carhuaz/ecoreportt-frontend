import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="acceso-denegado-page">
      <div class="acceso-denegado-container">
        <div class="icon">🔒</div>
        <h1>Acceso Denegado</h1>
        <p>No tienes permiso para acceder a esta página.</p>
        <p class="sub-text">Tu rol actual no tiene autorización para ver este contenido.</p>
        <div class="actions">
          <button class="btn-primary" routerLink="/dashboard">Ir al Dashboard</button>
          <button class="btn-secondary" routerLink="/login">Volver al Login</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .acceso-denegado-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .acceso-denegado-container {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    h1 {
      color: #0f172a;
      margin-bottom: 1rem;
      font-size: 2rem;
    }

    p {
      color: #64748b;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }

    .sub-text {
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-direction: column;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: #00a63e;
      color: white;
    }

    .btn-primary:hover {
      background: #166534;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 166, 62, 0.3);
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #0f172a;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }
  `]
})
export class AccesoDenegadoComponent {}
