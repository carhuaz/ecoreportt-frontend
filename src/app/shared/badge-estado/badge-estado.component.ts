import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge-estado',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="clase">{{ estado }}</span>`,
  styles: [`
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .pendiente  { background: #fee2e2; color: #dc2626; }
    .aprobado   { background: #dbeafe; color: #2563eb; }
    .programado { background: #fef3c7; color: #d97706; }
    .atendido   { background: #dcfce7; color: #16803c; }
    .verificado { background: #d1fae5; color: #065f46; }
    .rechazado  { background: #f3f4f6; color: #6b7280; }
    .critica    { background: #f3e8ff; color: #7c3aed; }
    .en-atencion { background: #fef3c7; color: #d97706; }
    .disponible { background: #dcfce7; color: #16803c; }
    .en-ruta    { background: #dbeafe; color: #2563eb; }
    .ocupada    { background: #fee2e2; color: #dc2626; }
  `]
})
export class BadgeEstadoComponent {
  @Input() estado: string = 'Pendiente';

  get clase(): string {
    return this.estado.toLowerCase().replace(/\s+/g, '-');
  }
}
