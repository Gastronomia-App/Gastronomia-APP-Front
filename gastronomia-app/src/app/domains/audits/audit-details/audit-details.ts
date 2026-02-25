import { Component, inject, output, signal, computed, viewChild, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Detail } from '../../../shared/components/detail/detail';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { AuditFormService } from '../services/audit-form.service';
import { AuditService } from '../../../services/audit.service';
import { Audit, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-audit-details',
  standalone: true,
  imports: [CommonModule, FormsModule, Detail, ConfirmationModalComponent],
  templateUrl: './audit-details.html',
  styleUrl: './audit-details.css',
  host: {
    class: 'entity-details'
  }
})
export class AuditDetails {
  private auditFormService = inject(AuditFormService);
  private auditService = inject(AuditService);
  private destroyRef = inject(DestroyRef);

  onDetailsClosed = output<void>();

  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);

  // Signals
  audit = signal<Audit | null>(null);
  realCash = signal<number>(0);
  showFinalizeModal = signal<boolean>(false);
  showCancelModal = signal<boolean>(false);

  // Computed
  formattedStartTime = computed(() => {
    const currentAudit = this.audit();
    if (!currentAudit?.startTime) return '-';

    const date = new Date(currentAudit.startTime);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  formattedCloseTime = computed(() => {
    const currentAudit = this.audit();
    if (!currentAudit?.closeTime) return '-';

    const date = new Date(currentAudit.closeTime);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  formattedInitialCash = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.initialCash == null) return '-';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentAudit.initialCash);
  });

  formattedTotalExpensed = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.totalExpensed == null) return '-';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentAudit.totalExpensed);
  });

  formattedTotal = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.total == null) return '-';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentAudit.total);
  });

  formattedRealCash = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.realCash == null) return '-';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentAudit.realCash);
  });

  formattedBalanceGap = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.balanceGap == null) return '-';

    const value = currentAudit.balanceGap;
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);

    if (value > 0) return `+${formatted}`;
    if (value < 0) return formatted;
    return formatted;
  });

  // Expected cash = negative of balance gap
  expectedCash = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.balanceGap == null) return 0;
    return -currentAudit.balanceGap;
  });

  formattedExpectedCash = computed(() => {
    const expected = this.expectedCash();
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(expected);
  });

  balanceGapClass = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.balanceGap == null) return '';

    const value = currentAudit.balanceGap;
    if (value > 0) return 'balance-positive';
    if (value < 0) return 'balance-negative';
    return 'balance-neutral';
  });

  auditStatus = computed(() => {
    const currentAudit = this.audit();
    if (currentAudit?.auditStatus === 'IN_PROGRESS') return 'En Progreso';
    if (currentAudit?.auditStatus === 'FINALIZED') return 'Finalizada';
    if (currentAudit?.auditStatus === 'CANCELED') return 'Cancelada';
    return currentAudit?.auditStatus || '-';
  });

  isOpen = computed(() => {
    const status = this.audit()?.auditStatus;
    return status === 'IN_PROGRESS';
  });

  constructor() {
    // Effect to re-render detail when audit changes
    effect(() => {
      const currentAudit = this.audit();
      // Track dependency
      if (currentAudit) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Audit> = {
    title: 'Detalles de la Auditoría',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información de la auditoría',
        fields: [
          {
            name: 'auditStatus',
            label: 'Estado',
            type: 'text',
            formatter: () => this.auditStatus()
          },
          {
            name: 'startTime',
            label: 'Fecha y hora de apertura',
            type: 'text',
            formatter: () => this.formattedStartTime()
          },
          {
            name: 'closeTime',
            label: 'Fecha y hora de cierre',
            type: 'text',
            formatter: () => this.formattedCloseTime()
          },
          {
            name: 'initialCash',
            label: 'Efectivo inicial',
            type: 'text',
            formatter: () => this.formattedInitialCash()
          },
          {
            name: 'totalExpensed',
            label: 'Total gastado',
            type: 'text',
            formatter: () => this.formattedTotalExpensed()
          },
          {
            name: 'total',
            label: 'Ingresos totales',
            type: 'text',
            formatter: () => this.formattedTotal()
          },
          {
            name: 'realCash',
            label: 'Saldo Real',
            type: 'text',
            formatter: () => this.formattedRealCash(),
            condition: (audit: Audit) => audit.realCash != null
          },
          {
            name: 'balanceGap',
            label: 'Diferencia',
            type: 'text',
            formatter: () => this.formattedBalanceGap(),
            cssClass: this.balanceGapClass(),
            condition: (audit: Audit) => audit.auditStatus === 'FINALIZED'
          }
        ]
      }
    ],
    actions: [
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      },
      {
        label: 'Cancelar Auditoría',
        type: 'danger',
        handler: () => this.openCancelModal(),
        condition: () => this.isOpen()
      },
      {
        label: 'Finalizar Auditoría',
        type: 'primary',
        handler: () => this.openFinalizeModal(),
        condition: () => this.isOpen()
      }
    ]
  };

  loadAudit(audit: Audit): void {
    this.audit.set(audit);
  }

  openFinalizeModal(): void {
    const currentAudit = this.audit();
    const status = currentAudit?.auditStatus;
    if (currentAudit && status === 'IN_PROGRESS') {
      // Initialize realCash with expected cash (total - totalExpensed)
      this.realCash.set(this.expectedCash());
      this.showFinalizeModal.set(true);
    }
  }

  cancelFinalize(): void {
    this.showFinalizeModal.set(false);
    this.realCash.set(0);
  }

  openCancelModal(): void {
    const currentAudit = this.audit();
    if (currentAudit && currentAudit.auditStatus === 'IN_PROGRESS') {
      this.showCancelModal.set(true);
    }
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
  const currentAudit = this.audit();
  if (!currentAudit) return;

  this.auditService.cancelAudit(currentAudit.id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (canceledAudit) => {
        this.showCancelModal.set(false);
        this.audit.set(canceledAudit);
        this.auditFormService.notifyAuditUpdated(canceledAudit);
        this.onClose();
      }
      // No error callback -> error goes to global handler
    });
}

  confirmFinalize(): void {
  const currentAudit = this.audit();
  if (!currentAudit) return;

  const realCashValue = this.realCash();

  // Basic validation before sending request
  if (realCashValue == null || realCashValue < 0) {
    console.error('Final cash amount must be greater or equal than 0.');
    return;
  }

  this.auditService.finalizeAudit(currentAudit.id, { realCash: realCashValue })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (finalizedAudit) => {
        this.showFinalizeModal.set(false);
        this.audit.set(finalizedAudit);
        this.auditFormService.notifyAuditFinalized(finalizedAudit);
        this.onClose();
      }
    });
}

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
