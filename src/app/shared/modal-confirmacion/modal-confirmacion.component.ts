import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacion.component.html',
  styleUrls: ['./modal-confirmacion.component.css']
})
export class ModalConfirmacionComponent {
  @Input() visible = false;
  @Input() titulo = '¿Confirmar acción?';
  @Input() mensaje = 'Esta acción no se puede deshacer.';
  @Input() textoConfirmar = 'Confirmar';
  @Input() tipoBtnConfirmar: 'primario' | 'peligro' | 'exito' = 'primario';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void { this.confirmar.emit(); }
  onCancelar(): void { this.cancelar.emit(); }
}
