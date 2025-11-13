import { Component, inject, DestroyRef, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';

@Component({
  selector: 'app-employees-table',
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './employees-table.html',
  styleUrl: './employees-table.css',
  host: { class: 'entity-table' }
})
export class EmployeesTable extends BaseTable<Employee> {

  private employeeService = inject(EmployeeService);
  private employeeFormService = inject(EmployeeFormService);
  private authService = inject(AuthService);
  public override destroyRef: DestroyRef = inject(DestroyRef);

  onNewEmployeeClick = output<void>();

  // === Datos para el modal ===
  showDeleteModal = signal(false);
  override itemToDelete: { id: number, name: string } | null = null;

  // === Mensaje ===
  get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar al empleado "${this.itemToDelete.name}"?`;
  }

  // === Filtros ===
  filters: TableFilter<Employee>[] = [
    {
      label: 'Rol',
      field: 'role',
      type: 'select',
      options: [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'CASHIER', label: 'Cajero' },
        { value: 'WAITER', label: 'Mozo' }
      ],
      filterFn: (employee, value) => !value || value === '' ? true : employee.role === value
    },
    {
      label: 'Estado',
      field: 'deleted',
      type: 'select',
      options: [
        { value: 'false', label: 'Activo' },
        { value: 'true', label: 'Inactivo' }
      ],
      filterFn: (employee, value) =>
        !value || value === '' ? true : (employee.deleted ?? false).toString() === value
    }
  ];

  constructor() {
    super();
    this.tableService.setPageSize(1000);
    this.tableService.setFilterFunction((employee, term) => {
      const s = term.toLowerCase();
      return (
        employee.name.toLowerCase().includes(s) ||
        employee.lastName.toLowerCase().includes(s) ||
        (employee.email?.toLowerCase().includes(s) ?? false)
      );
    });
  }

  // ============================
  // Métodos obligatorios BaseTable
  // ============================

  protected getColumns(): TableColumn<Employee>[] {
    return [
      { header: 'Nombre', field: 'name', sortable: true },
      { header: 'Apellido', field: 'lastName', sortable: true },
      { header: 'Email', field: 'email', sortable: true },
      { header: 'Teléfono', field: 'phoneNumber' },
      {header: 'Rol',
        field: 'role',
        sortable: true,
        formatter: (value: string) => {
  const roleLabels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    CASHIER: 'Cajero',
    WAITER: 'Mozo',
  };

  return roleLabels[value as keyof typeof roleLabels] ?? value;
}},
      { 
        header: 'Estado',
        field: 'deleted',
        template: 'badge',
        badgeConfig: {
          field: 'deleted',
          truthyClass: 'badge-inactive',
          falsyClass: 'badge-active',
          truthyLabel: 'Inactivo',
          falsyLabel: 'Activo'
        }
      }
    ];
  }

  protected fetchData(p: number, s: number) {
    return this.employeeService.getEmployeesPage(p, s, 'id,asc');
  }

  protected fetchItemById(id: number) {
    return this.employeeService.getEmployeeById(id);
  }

  protected deleteItem(id: number) {
    return this.employeeService.deleteEmployee(id);
  }

  protected getItemName(emp: Employee): string {
    return `${emp.name} ${emp.lastName}`;
  }

  protected getItemId(emp: Employee): number {
    return emp.id!;
  }

  // ============================
  // DELETE (modificado)
  // ============================

  override onTableDelete(employee: Employee) {
    this.itemToDelete = {
      id: employee.id!,
      name: `${employee.name} ${employee.lastName}`
    };

    this.showDeleteModal.set(true);
  }

  override onConfirmDelete() {
    if (!this.itemToDelete) return;

    this.deleteItem(this.itemToDelete.id).subscribe(() => {
      this.refreshData();
      this.showDeleteModal.set(false);
      this.itemToDelete = null;
    });
  }

  override onCancelDelete() {
    this.showDeleteModal.set(false);
    this.itemToDelete = null;
  }

  // ============================
  // Edit / Details
  // ============================

  protected onEditItem(employee: Employee): void {
    const logged = (this.authService.role() ?? '').replace('ROLE_', '');
    const target = (employee.role ?? '').replace('ROLE_', '');

    if (logged === 'ADMIN' && (target === 'OWNER' || target === 'ADMIN')) return;

    this.employeeFormService.editEmployee(employee);
  }

  protected onViewDetails(employee: Employee): void {
    this.employeeFormService.viewEmployeeDetails(employee);
  }
  public onNewEmployee(): void {
  this.onNewEmployeeClick.emit();
}
}
