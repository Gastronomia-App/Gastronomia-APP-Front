import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseTable } from '../../../shared/components/table/base-table.directive';
import { Table } from '../../../shared/components/table/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { Audit, TableColumn, TableFilter } from '../../../shared/models';
import { AuditService } from '../../../services/audit.service';
import { AuditFormService } from '../services';

@Component({
  selector: 'app-audit-table',
  standalone: true,
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './audit-table.html',
  styleUrl: './audit-table.css'
})
export class AuditTable extends BaseTable<Audit> {
  // ==================== Services ====================
  
  private auditService = inject(AuditService);
  private auditFormService = inject(AuditFormService);

  // ==================== Output Events ====================
  
  onAuditSelected = output<Audit>();
  onNewAuditClick = output<void>();

  // ==================== Filters Configuration ====================
  
  filters: TableFilter<Audit>[] = [
    {
      label: 'Estado',
      field: 'auditStatus',
      type: 'select',
      options: [
        { label: 'En Progreso', value: 'IN_PROGRESS' },
        { label: 'Finalizada', value: 'FINALIZED' },
        { label: 'Cancelada', value: 'CANCELED' }
      ],
      filterFn: (audit, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    },
    {
      label: 'Fecha Desde',
      field: 'startDate',
      type: 'date',
      filterFn: (audit, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    },
    {
      label: 'Fecha Hasta',
      field: 'endDate',
      type: 'date',
      filterFn: (audit, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    }
  ];

  // ==================== Custom Search Filter ====================
  
  /**
   * Custom search filter function - Search by ID
   */
  public customSearchFilter = (audit: Audit, searchTerm: string): boolean => {
    // Search by ID
    const idMatch = audit.id.toString().includes(searchTerm);
    
    return idMatch;
  };

  // ==================== Constructor ====================
  
  constructor() {
    super();
  }

  // ==================== Table Initialization ====================
  
  protected override initializeTable(): void {
    // Set page size for audits (20 items per page)
    this.tableService.setPageSize(20);
  }

  // ==================== Required Abstract Method Implementations ====================
  
  protected getColumns(): TableColumn<Audit>[] {
    return [
      {
        header: 'Apertura',
        field: 'startTime',
        sortable: true,
        align: 'left',
        formatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        header: 'Cierre',
        field: 'closeTime',
        sortable: true,
        align: 'left',
        formatter: (value: string | null) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        header: 'Estado',
        field: 'auditStatus',
        sortable: true,
        align: 'center',
        formatter: (value: string) => {
          if (value === 'IN_PROGRESS') return '🟢 En Progreso';
          if (value === 'FINALIZED') return '🔴 Finalizada';
          if (value === 'CANCELED') return '⚫ Cancelada';
          return value || '-';
        }
      },
      {
        header: 'Total',
        field: 'total',
        sortable: true,
        align: 'right',
        formatter: (value: number) => {
          if (value == null) return '-';
          return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }).format(value);
        }
      }
    ];
  }

  // Store current filter values
  private currentStatusFilter: string | null = null;
  private currentStartDateFilter: string | null = null;
  private currentEndDateFilter: string | null = null;

  protected fetchData(page: number, size: number) {
    // Build filter parameters for backend
    const filters: any = {
      page,
      size,
      sort: 'startTime,desc'
    };

    // Add filters if they exist
    if (this.currentStatusFilter) {
      filters.auditStatus = this.currentStatusFilter;
    }

    if (this.currentStartDateFilter) {
      filters.startDate = this.currentStartDateFilter;
    }

    if (this.currentEndDateFilter) {
      filters.endDate = this.currentEndDateFilter;
    }

    return this.auditService.getAudits(filters);
  }

  protected fetchItemById(id: number) {
    return this.auditService.getAuditById(id);
  }

  protected deleteItem(id: number) {
    return this.auditService.cancelAudit(id);
  }

  protected getItemName(audit: Audit): string {
    const startDate = new Date(audit.startTime);
    const formatted = startDate.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Auditoría #${audit.id} - ${formatted}`;
  }

  protected getItemId(audit: Audit): number {
    return audit.id;
  }

  protected onEditItem(audit: Audit): void {
    // Audits cannot be edited, only viewed/finalized
    // Redirect to details view instead
    this.auditFormService.viewAuditDetails(audit);
  }

  protected onViewDetails(audit: Audit): void {
    this.auditFormService.viewAuditDetails(audit);
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de cancelar la auditoría "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ==================== Custom Subscriptions ====================
  
  protected override setupCustomSubscriptions(): void {
    this.auditFormService.activeAuditId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.auditFormService.auditCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.auditFormService.auditUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });

    this.auditFormService.auditFinalized$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated(); // Refresh the table after finalization
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Audit)
   * Emits an event to the parent component
   */
  public onNewAudit(): void {
    this.onNewAuditClick.emit();
  }

  /**
   * Permite al componente padre forzar un refresh de los datos
   */
  public refreshList(): void {
    this.refreshData();
  }

  /**
   * Permite al componente padre establecer el término de búsqueda
   */
  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  /**
   * Permite al componente padre limpiar la búsqueda
   */
  public clearSearchTerm(): void {
    this.clearSearch();
  }

  /**
   * Handler for filters change event from table component
   * Updates filter properties and reloads data from backend
   */
  public onFiltersChange(filters: any[]): void {
    // Reset all filters first
    this.currentStatusFilter = null;
    this.currentStartDateFilter = null;
    this.currentEndDateFilter = null;

    // Apply active filters
    filters.forEach(filter => {
      if (filter.field === 'auditStatus') {
        // Check if value exists and is not empty string
        this.currentStatusFilter = filter.value && filter.value !== '' ? filter.value : null;
      } else if (filter.field === 'startDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentStartDateFilter = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else if (filter.field === 'endDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentEndDateFilter = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    });

    // Reload data with new filters
    this.refreshData();
  }
}
