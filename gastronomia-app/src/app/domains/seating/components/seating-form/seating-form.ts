import {
  Component,
  inject,
  input,
  output,
  computed,
  effect,
  viewChild,
  signal,
  Injector,
  runInInjectionContext,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Form } from '../../../../shared/components/form/form';
import { Confirm } from '../../../../shared/components/confirm/confirm';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

import {
  Seating,
  SeatingCreateRequest,
  SeatingUpdateRequest,
} from '../../../../shared/models/seating';
import { FormConfig, FormSubmitEvent } from '../../../../shared/models/form-config.model';
import { SeatingsService } from '../../services/seating-service';

@Component({
  selector: 'app-seating-form',
  standalone: true,
  imports: [CommonModule, Form, Confirm, AlertComponent],
  templateUrl: './seating-form.html',
  styleUrl: './seating-form.css',
})
export class SeatingForm {
  private readonly seatingsService = inject(SeatingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly showAlert = signal(false);
  readonly alertTitle = signal('');
  readonly alertMessage = signal('');
  readonly alertDetails = signal<any>(null);
  readonly showConfirm = signal(false);

  seating = input<Seating>();
  mode = input<'create' | 'edit'>('create');
  closed = output<void>();
  changed = output<Partial<Seating>>();

  formRef = viewChild(Form<any>);
  private lastSeating: string | null = null;
  private lastEmitted: string | null = null;

  formConfig = computed<FormConfig<Seating>>(() => {
    const s = this.seating();
    return {
      title: this.mode() === 'create' ? 'Nueva ubicación' : 'Editar ubicación',
      submitLabel: this.mode() === 'create' ? 'Crear ubicación' : 'Guardar cambios',
      sections: [
        {
          fields: [
            {
              name: 'number',
              label: 'Número',
              type: 'number',
              required: true,
              min: 1,
              max: 9999,
              fullWidth: true,
              defaultValue: s?.number ?? null,
            },
          ],
        },
        {
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
      if (!form || !s) return;

      const serialized = JSON.stringify({
        number: s.number,
        posX: s.posX,
        posY: s.posY,
        shape: s.shape,
        size: s.size,
      });
      if (this.lastSeating === serialized) return;
      this.lastSeating = serialized;

      form.resetForm();
      form.loadData(s as any);

      runInInjectionContext(this.injector, () => {
        const ngForm: import('@angular/forms').FormGroup | undefined = (form as any).form;
        if (!ngForm) return;

        ngForm.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((val) => {
            const payload = {
              number: val?.number,
              posX: val?.posX,
              posY: val?.posY,
              shape: val?.shape,
              size: val?.size,
            } as Partial<Seating>;

            const serializedChange = JSON.stringify(payload);
            if (this.lastEmitted === serializedChange) return;
            this.lastEmitted = serializedChange;

            // SOLO preview: el padre actualiza señales locales, sin tocar backend
            this.changed.emit(payload);
          });
      });
    });
  }

  onSubmit(event: FormSubmitEvent<Seating>): void {
    const base = this.seating();
    if (!base) return;

    if (this.mode() === 'create') {
      const payloadCreate: SeatingCreateRequest = {
        number: Number(event.data.number),
        posX: Number(event.data.posX),
        posY: Number(event.data.posY),
        shape: event.data.shape,
        size: event.data.size,
      };
      this.seatingsService.create(payloadCreate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.closed.emit(),
          error: (err) => {
            this.alertTitle.set('Error al crear');
            this.alertMessage.set(err?.error?.message || 'Ocurrió un error.');
            this.alertDetails.set(err);
            this.showAlert.set(true);
          },
        });
    } else {
      const payloadUpdate: SeatingUpdateRequest = {
        id: base.id,
        number: Number(event.data.number),
        posX: Number(event.data.posX),
        posY: Number(event.data.posY),
        shape: event.data.shape,
        size: event.data.size,
      };
      this.seatingsService.update(base.id, payloadUpdate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.closed.emit(),
          error: (err) => {
            this.alertTitle.set('Error al actualizar');
            this.alertMessage.set(err?.error?.message || 'Ocurrió un error.');
            this.alertDetails.set(err);
            this.showAlert.set(true);
          },
        });
    }
  }

  onDeleteConfirmed(): void {
    const s = this.seating();
    if (!s) return;

    this.seatingsService.delete(s.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showConfirm.set(false);
          this.closed.emit();
        },
        error: (err) => {
          this.alertTitle.set('Error al eliminar');
          this.alertMessage.set(err?.error?.message || 'No se pudo eliminar la ubicación.');
          this.alertDetails.set(err);
          this.showAlert.set(true);
        },
      });
  }

  onCancel(): void { this.closed.emit(); }
  onClose(): void { this.closed.emit(); }
}
