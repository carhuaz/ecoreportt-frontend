import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-uploader">
      <div class="upload-area" *ngIf="imagenes.length < 3">
        <input
          type="file"
          #fileInput
          (change)="onFileSelected($event)"
          accept=".jpg,.jpeg,.png,.webp"
          style="display: none"
        />
        <div class="upload-box" (click)="fileInput.click()">
          <div class="upload-icon">📸</div>
          <p class="upload-text">Haz clic o arrastra imágenes aquí</p>
          <p class="upload-hint">JPG, JPEG, PNG, WEBP • Máx 2 MB</p>
        </div>
      </div>

      <div class="alert alert-warning" *ngIf="imagenes.length >= 3">
        ℹ️ Solo puedes subir hasta 3 imágenes
      </div>

      <div *ngIf="errorMensaje" class="alert alert-error">
        ⚠️ {{ errorMensaje }}
      </div>

      <div class="previews" *ngIf="imagenes.length > 0">
        <h4>Imágenes cargadas ({{ imagenes.length }}/3)</h4>
        <div class="preview-grid">
          <div *ngFor="let imagen of imagenes; let i = index" class="preview-item">
            <img [src]="imagen" alt="Previsualización">
            <button type="button" class="btn-remove" (click)="removerImagen(i)">✕</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-uploader {
      width: 100%;
    }

    .upload-area {
      margin-bottom: 1.5rem;
    }

    .upload-box {
      border: 2px dashed var(--color-primary);
      border-radius: var(--radius-lg);
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 166, 62, 0.02);
    }

    .upload-box:hover {
      background: rgba(0, 166, 62, 0.05);
      border-color: var(--color-primary-dark);
    }

    .upload-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .upload-text {
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .upload-hint {
      font-size: 0.85rem;
      color: var(--color-muted);
      margin: 0.5rem 0 0 0;
    }

    .alert {
      margin-bottom: 1rem;
    }

    .previews {
      margin-top: 1.5rem;
    }

    .previews h4 {
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 1rem;
    }

    .preview-item {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 2px solid var(--color-border);
      background: var(--color-bg);
    }

    .preview-item img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      display: block;
    }

    .btn-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 28px;
      height: 28px;
      padding: 0;
      background: rgba(220, 38, 38, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-remove:hover {
      background: rgba(220, 38, 38, 1);
      transform: scale(1.1);
    }
  `]
})
export class ImageUploaderComponent {
  @Output() imagenesChange = new EventEmitter<string[]>();
  @Input() set imagenes(value: string[]) {
    this._imagenes = value || [];
  }

  _imagenes: string[] = [];
  errorMensaje = '';

  get imagenes(): string[] {
    return this._imagenes;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    this.errorMensaje = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar extensión
      const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !extensionesPermitidas.includes(extension)) {
        this.errorMensaje = 'Formato no permitido. Solo JPG, JPEG, PNG, WEBP.';
        input.value = '';
        return;
      }

      // Validar tamaño (máx 2 MB)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMensaje = 'La imagen supera el tamaño máximo de 2 MB.';
        input.value = '';
        return;
      }

      // Validar cantidad máxima de imágenes
      if (this._imagenes.length >= 3) {
        this.errorMensaje = 'Solo puedes subir hasta 3 imágenes.';
        input.value = '';
        return;
      }

      // Leer imagen y agregar a la lista
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this._imagenes.push(e.target.result as string);
          this.imagenesChange.emit([...this._imagenes]);
        }
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removerImagen(index: number): void {
    this._imagenes.splice(index, 1);
    this.imagenesChange.emit([...this._imagenes]);
    this.errorMensaje = '';
  }
}
