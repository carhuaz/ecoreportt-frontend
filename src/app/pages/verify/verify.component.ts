import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
<div class="verify-page">
  <div class="verify-card">
    <div class="verify-icon">📧</div>
    <h2>Verifica tu cuenta</h2>
    <p class="verify-sub">
      Te enviamos un código de 6 dígitos a <strong>{{ email }}</strong>
    </p>

    <div class="alert alert-error" *ngIf="error">{{ error }}</div>
    <div class="alert alert-success" *ngIf="exito">
      ✅ Cuenta verificada correctamente. Redirigiendo...
    </div>

    <div class="codigo-inputs">
      <input
        type="text"
        [(ngModel)]="codigo"
        placeholder="Ingresa el código"
        maxlength="6"
        inputmode="numeric"
        pattern="[0-9]{6}"
        (input)="onInput()"
        autocomplete="one-time-code"
      />
    </div>

    <button class="btn-verify" (click)="verificar()" [disabled]="cargando || codigo.length !== 6">
      {{ cargando ? 'Verificando...' : 'Verificar cuenta' }}
    </button>

    <p class="reenviar">
      ¿No recibiste el código?
      <a href="#" (click)="$event.preventDefault(); reenviar()">
        {{ reenviando ? 'Reenviando...' : 'Reenviar código' }}
      </a>
    </p>
  </div>
</div>
  `,
  styles: [`
    .verify-page {
      min-height: calc(100vh - 130px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f7f5;
      padding: 2rem;
    }
    .verify-card {
      background: #fff;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      text-align: center;
    }
    .verify-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; color: #1f2937; margin: 0 0 0.25rem; }
    .verify-sub { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .verify-sub strong { color: #1f2937; }

    .codigo-inputs { margin-bottom: 1.25rem; }
    .codigo-inputs input {
      width: 100%;
      padding: 0.75rem 0.875rem;
      border: 2px solid #d1d5db;
      border-radius: 10px;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 8px;
      text-align: center;
      font-family: monospace;
      color: #1f2937;
      background: #fff;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .codigo-inputs input:focus {
      outline: none;
      border-color: #16803c;
    }

    .btn-verify {
      width: 100%;
      background: #16803c;
      color: #fff;
      border: none;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-verify:hover:not(:disabled) { background: #0f5132; }
    .btn-verify:disabled { background: #d1d5db; cursor: not-allowed; }

    .reenviar {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #6b7280;
    }
    .reenviar a {
      color: #16803c;
      font-weight: 600;
      text-decoration: none;
    }
    .reenviar a:hover { text-decoration: underline; }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .alert-error   { background: #fee2e2; color: #dc2626; }
    .alert-success { background: #dcfce7; color: #16803c; }
  `]
})
export class VerifyComponent implements OnInit {
  email = '';
  codigo = '';
  error = '';
  exito = false;
  cargando = false;
  reenviando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.params['email'] || '';
    if (!this.email) {
      this.router.navigate(['/login']);
    }
  }

  onInput(): void {
    this.codigo = this.codigo.replace(/\D/g, '');
  }

  verificar(): void {
    if (this.codigo.length !== 6) return;
    this.error = '';
    this.cargando = true;
    this.authService.verificarCodigo(this.email, this.codigo).subscribe(ok => {
      this.cargando = false;
      if (!ok) {
        this.error = 'Código incorrecto. Revisa tu correo o solicita uno nuevo.';
        return;
      }
      this.exito = true;
      setTimeout(() => this.router.navigate(['/login']), 2000);
    });
  }

  reenviar(): void {
    this.reenviando = true;
    this.authService.reenviarCodigo(this.email).subscribe(ok => {
      this.reenviando = false;
      if (ok) {
        this.error = '';
        alert('Código reenviado a tu correo.');
      } else {
        this.error = 'Error al reenviar. Intenta de nuevo.';
      }
    });
  }
}
