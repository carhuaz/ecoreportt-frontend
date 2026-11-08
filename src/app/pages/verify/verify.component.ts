import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  pattern,
  required
} from '@angular/forms/signals';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';

interface VerifyModel {
  codigo: string;
}

@Component({
  selector: 'app-verify',
  imports: [FormField, FormRoot],
  template: `
<div class="verify-page">
  <div class="verify-card">
    <div class="verify-icon">📧</div>
    <h2>Verifica tu cuenta</h2>
    <p class="verify-sub">
      Te enviamos un código de 6 dígitos a <strong>{{ email() }}</strong>
    </p>

    @if (serverError()) {
      <div class="alert alert-error">{{ serverError() }}</div>
    }
    @if (successMessage()) {
      <div class="alert alert-success">{{ successMessage() }}</div>
    }
    @if (exito()) {
      <div class="alert alert-success">
        ✅ Cuenta verificada correctamente. Redirigiendo...
      </div>
    }

    <form [formRoot]="verifyForm">
      <div class="codigo-inputs">
        <input
          type="text"
          [formField]="verifyForm.codigo"
          placeholder="Ingresa el código"
          inputmode="numeric"
          autocomplete="one-time-code"
        />
        @if (verifyForm.codigo().touched() && verifyForm.codigo().invalid()) {
          @for (error of verifyForm.codigo().errors(); track error.kind) {
            <small class="field-error">{{ error.message }}</small>
          }
        }
      </div>

      <button class="btn-verify" type="submit" [disabled]="verifyForm().submitting()">
        {{ verifyForm().submitting() ? 'Verificando...' : 'Verificar cuenta' }}
      </button>
    </form>

    <p class="reenviar">
      ¿No recibiste el código?
      <button
        type="button"
        class="link-btn"
        (click)="reenviar()"
        [disabled]="reenviando() || cooldown() > 0"
      >
        @if (reenviando()) {
          Reenviando...
        } @else if (cooldown() > 0) {
          Reenviar en {{ cooldown() }}s
        } @else {
          Reenviar código
        }
      </button>
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

    .field-error {
      display: block;
      margin-top: 0.35rem;
      color: #dc2626;
      font-size: 0.8rem;
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
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: #16803c;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .link-btn:hover:not(:disabled) { text-decoration: underline; }
    .link-btn:disabled { color: #9ca3af; cursor: not-allowed; }

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
export class VerifyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cooldownTimer?: ReturnType<typeof setInterval>;

  readonly email = signal('');
  readonly verifyModel = signal<VerifyModel>({ codigo: '' });
  readonly serverError = signal('');
  readonly successMessage = signal('');
  readonly exito = signal(false);
  readonly reenviando = signal(false);
  readonly cooldown = signal(0);

  readonly verifyForm = form(this.verifyModel, path => {
    required(path.codigo, { message: 'Ingresa el código.' });
    maxLength(path.codigo, 6, { message: 'El código debe tener 6 dígitos.' });
    pattern(path.codigo, /^\d{6}$/, { message: 'El código debe tener 6 dígitos.' });
  }, {
    submission: {
      action: async () => {
        this.serverError.set('');
        this.successMessage.set('');
        this.exito.set(false);

        const res = await firstValueFrom(
          this.authService.verificarCodigo(this.email(), this.verifyModel().codigo)
        );

        if (!res.ok) {
          if (res.cooldownSegundos) {
            this.iniciarCooldown(res.cooldownSegundos);
          }
          this.serverError.set(
            res.mensaje || 'Código incorrecto. Revisa tu correo o solicita uno nuevo.'
          );
          return;
        }

        this.exito.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    }
  });

  ngOnInit(): void {
    const email = this.route.snapshot.params['email'] || '';
    this.email.set(email);

    if (!email) {
      this.router.navigate(['/login']);
      return;
    }

    const cooldown = Number(this.route.snapshot.params['cooldown'] || 0);
    if (cooldown > 0) {
      this.iniciarCooldown(cooldown);
    }
  }

  ngOnDestroy(): void {
    this.detenerCooldown();
  }

  async reenviar(): Promise<void> {
    if (this.reenviando() || this.cooldown() > 0) return;

    this.reenviando.set(true);
    this.serverError.set('');
    this.successMessage.set('');

    const res = await firstValueFrom(this.authService.reenviarCodigo(this.email()));
    this.reenviando.set(false);

    if (!res.ok) {
      if (res.cooldownSegundos) {
        this.iniciarCooldown(res.cooldownSegundos);
      }
      this.serverError.set(res.mensaje || 'No se pudo reenviar el código. Intenta de nuevo.');
      return;
    }

    this.verifyModel.set({ codigo: '' });
    this.successMessage.set(res.mensaje || 'Código reenviado. Revisa tu correo.');
    this.iniciarCooldown(60);
  }

  private iniciarCooldown(segundos: number): void {
    this.detenerCooldown();
    this.cooldown.set(Math.max(0, Math.floor(segundos)));

    if (this.cooldown() === 0) return;

    this.cooldownTimer = setInterval(() => {
      const siguiente = this.cooldown() - 1;
      this.cooldown.set(siguiente);
      if (siguiente <= 0) {
        this.detenerCooldown();
      }
    }, 1000);
  }

  private detenerCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
  }
}
