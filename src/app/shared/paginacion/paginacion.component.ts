import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginacion.component.html'
})
export class PaginacionComponent {
  @Input() page = 1;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  paginas(): number[] {
    const resultado: number[] = [];
    const inicio = Math.max(1, this.page - 2);
    const fin = Math.min(this.totalPages, this.page + 2);
    for (let i = inicio; i <= fin; i++) resultado.push(i);
    return resultado;
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.pageChange.emit(p);
  }
}
