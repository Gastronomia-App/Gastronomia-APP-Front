import {
  Component,
  inject,
  input,
  output,
  computed,
  effect,
  viewChild,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../../../shared/components/form/form';
import { Confirm } from '../../../../shared/components/confirm/confirm'; // ✅ import del modal confirm
import {
  Seating,
  SeatingCreateRequest,
  SeatingUpdateRequest,
} from '../../../../shared/models/seating';
import { TablesService } from '../../services/tables-service';
import { FormConfig, FormSubmitEvent } from '../../../../shared/models/form-config.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [CommonModule, Form, Confirm, AlertComponent],
  templateUrl: './table-form.html',
  styleUrl: './table-form.css',
})
export class TableForm {
  private readonly tablesService = inject(TablesService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly errorDialog = signal<{ title: string; message: string } | null>(null);

readonly showAlert = signal(false);
readonly alertTitle = signal('');
readonly alertMessage = signal('');
readonly alertDetails = signal<any>(null);



  seating = input<Seating>();
  mode = input<'create' | 'edit'>('create');
  closed = output<void>();

  formRef = viewChild(Form<any>);
  readonly showConfirm = signal(false); // ✅ señal para controlar el modal

  formConfig = computed<FormConfig<Seating>>(() => {
    const s = this.seating();
    return {
      title: this.mode() === 'create' ? 'Nueva mesa' : 'Editar mesa',
      submitLabel: this.mode() === 'create' ? 'Crear mesa' : 'Guardar cambios',
      sections: [
        {
          title: 'Identificación',
          fields: [
            {
              name: 'number',
              label: 'Número',
              type: 'number',
              required: true,
              min: 1,
              fullWidth: true,
              defaultValue: s?.number ?? null,
            },
          ],
        },
        {
          title: 'Posición en salón',
          fields: [
            {
              name: 'posX',
              label: 'Columna (X)',
              type: 'number',
              readonly: true,
              required: true,
              defaultValue: s?.posX ?? 1,
            },
            {
              name: 'posY',
              label: 'Fila (Y)',
              type: 'number',
              readonly: true,
              required: true,
              defaultValue: s?.posY ?? 1,
            },
          ],
        },
        {
          title: 'Apariencia',
          fields: [
            {
              name: 'shape',
              label: 'Forma',
              type: 'select',
              required: true,
              options: [
                { label: 'Cuadrada', value: 'SQUARE' },
                { label: 'Redonda', value: 'ROUND' },
              ],
              defaultValue: s?.shape ?? 'SQUARE',
            },
            {
              name: 'size',
              label: 'Tamaño',
              type: 'select',
              required: true,
              options: [
                { label: 'Chica', value: 'SMALL' },
                { label: 'Mediana', value: 'MEDIUM' },
                { label: 'Grande', value: 'LARGE' },
              ],
              defaultValue: s?.size ?? 'SMALL',
            },
          ],
        },
      ],
    };
  });

  constructor() {
    effect(() => {
      const s = this.seating();
      const form = this.formRef();

      if (form && s) {
        form.resetForm();
        form.loadData({
          number: s.number,
          posX: s.posX,
          posY: s.posY,
          shape: s.shape,
          size: s.size,
        } as any);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(event: FormSubmitEvent<Seating>): void {
  if (this.mode() === 'create') {
    const payload: SeatingCreateRequest = {
      number: Number(event.data.number),
      posX: Number(event.data.posX),
      posY: Number(event.data.posY),
      shape: event.data.shape,
      size: event.data.size,
    };

    this.tablesService.create(payload).subscribe({
      next: (created) => {
        console.log('✅ Mesa creada o reactivada:', created);
        this.closed.emit();
      },
      error: (err) => {
        this.alertTitle.set('Error al crear mesa');
        this.alertMessage.set(err.error?.message || 'Ocurrió un error inesperado.');
        this.alertDetails.set(err);
        this.showAlert.set(true);
      },
    });
  } else {
    const base = this.seating();
    if (!base) return;

    const payload: SeatingUpdateRequest = {
      id: base.id,
      number: Number(event.data.number),
      posX: Number(event.data.posX),
      posY: Number(event.data.posY),
      shape: event.data.shape,
      size: event.data.size,
    };

    this.tablesService.update(base.id, payload).subscribe({
      next: (updated) => {
        console.log('💾 Mesa actualizada:', updated);
        this.closed.emit();
      },
      error: (err) => {
        this.alertTitle.set('Error al actualizar mesa');
        this.alertMessage.set(err.error?.message || 'Ocurrió un error al actualizar.');
        this.alertDetails.set(err);
        this.showAlert.set(true);
      },
    });
  }
}

  onDeleteConfirmed(): void {
  const s = this.seating();
  if (!s) return;

  this.tablesService.delete(s.id).subscribe({
    next: () => {
      console.log('🗑️ Mesa eliminada:', s.id);
      this.showConfirm.set(false);
      this.closed.emit();
    },
    error: (err) => {
      this.alertTitle.set('Error al eliminar mesa');
      this.alertMessage.set(err.error?.message || 'No se pudo eliminar la mesa.');
      this.alertDetails.set(err);
      this.showAlert.set(true);
    },
  });
}


  onCancel(): void {
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}