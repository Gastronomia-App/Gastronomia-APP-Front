import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload-field.html',
  styleUrl: './image-upload-field.css',
  host: {
    class: 'image-upload-field'
  }
})
export class ImageUploadField {
  // Existing image URL for edit mode
  imageUrl = input<string | null | undefined>(null);

  // Emits selected file or null (clear)
  fileSelected = output<File | null>();
imageCleared = output<void>();
  previewUrl = signal<string | null>(null);
  isDragOver = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Sync preview with external image URL (edit mode)
    effect(() => {
      const url = this.imageUrl();
      if (url && !this.previewUrl()) {
        this.previewUrl.set(`http://localhost:8080${url}`);
      }
    });
  }

  onOpenFileDialog(): void {
    const input = this.fileInput();
    if (input?.nativeElement) {
      input.nativeElement.click();
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.handleFile(file);

    // Allow selecting the same file again
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  clearImage(): void {
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.fileSelected.emit(null);
     this.imageCleared.emit();
  }

  private handleFile(file: File): void {
    this.errorMessage.set(null);

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Only image files are allowed.');
      return;
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      this.errorMessage.set(`Image size must be less than ${maxSizeMb}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.fileSelected.emit(file);
  }
}
