import { Component, inject, ViewChild, output, DestroyRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employees-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './employees-table.html',
  styleUrl: './employees-table.css',
  host: {
    class: 'entity-table'
  }
})
export class EmployeesTable extends BaseTable<Employee> implements OnInit {
  private employeeService = inject(EmployeeService);
  private employeeFormService = inject(EmployeeFormService);
  private authService = inject(AuthService);
  public override destroyRef: DestroyRef = inject(DestroyRef);

  // Output events para comunicación con el padre
  onEmployeeSelected = output<Employee>();
  onNewEmployeeClick = output<void>();

  // Filters configuration
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
      filterFn: (employee, value) => {
        if (!value || value === '') return true;
        return employee.role === value;
      }
    },
    {
      label: 'Estado',
      field: 'deleted',
      type: 'select',
      options: [
        { value: 'false', label: 'Activo' },
        { value: 'true', label: 'Inactivo' }
      ],
      filterFn: (employee, value) => {
        if (!value || value === '') return true;
        return (employee.deleted ?? false).toString() === value;
      }
    }
  ];
  
  confirmDialogVisible = false;
  confirmDialogDataValue: any = null;
  confirmDialogAction: (() => void) | null = null;

  // Signal para paginación
  override pagination = signal<any>({
    page: 1,
    pageSize: 1000,
    total: 0
  });

  constructor() {
    super();

    this.tableService.setPageSize(1000);
    
    // Set custom filter function for employees
    this.tableService.setFilterFunction((employee, term) => {
      const searchTerm = term.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.lastName.toLowerCase().includes(searchTerm) ||
        (employee.email?.toLowerCase().includes(searchTerm) ?? false)
      );
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<Employee>[] {
    return [
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Apellido',
        field: 'lastName',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Email',
        field: 'email',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Teléfono',
        field: 'phoneNumber',
        sortable: false,
        align: 'left'
      },
      {
        header: 'Rol',
        field: 'role',
        sortable: true,
        align: 'left',
        formatter: (value: string) => {
          const roleLabels: Record<string, string> = {
            'OWNER': 'Propietario',
            'ADMIN': 'Administrador',
            'CASHIER': 'Cajero',
            'WAITER': 'Mozo'
          };
          return roleLabels[value] || value;
        }
      },
      {
        header: 'Estado',
        field: 'deleted',
        align: 'left',
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

  protected fetchData(page: number, size: number) {
    return this.employeeService.getEmployeesPage(page, size, 'id,asc');
  }

  protected fetchItemById(id: number) {
    return this.employeeService.getEmployeeById(id);
  }

  protected deleteItem(id: number) {
    return this.employeeService.deleteEmployee(id);
  }

  protected getItemDisplayName(employee: Employee): string {
    return `${employee.name} ${employee.lastName}`;
  }

  protected getItemName(employee: Employee): string {
    return `${employee.name} ${employee.lastName}`;
  }

  protected getItemId(employee: Employee): number {
    return employee.id!;
  }

  /**
   * Override onEditItem para validar permisos antes de abrir formulario de edición
   * Un ADMIN no puede editar empleados OWNER ni ADMIN
   */
  protected onEditItem(employee: Employee): void {
    const loggedRole = this.authService.role();
    const employeeRole = employee.role;
    
    // Normalizar roles (quitar prefijo ROLE_)
    const normalizeRole = (role: string | null) => role?.replace('ROLE_', '') || '';
    const loggedRoleNormalized = normalizeRole(loggedRole);
    const employeeRoleNormalized = normalizeRole(employeeRole);
    
    // Si el logueado es ADMIN y el empleado es OWNER o ADMIN, no puede editar
    if (loggedRoleNormalized === 'ADMIN' && 
        (employeeRoleNormalized === 'OWNER' || employeeRoleNormalized === 'ADMIN')) {
      return;
    }
    
    // Si tiene permisos, abrir formulario de edición
    this.employeeFormService.editEmployee(employee);
  }

  protected onViewDetails(employee: Employee): void {
    this.employeeFormService.viewEmployeeDetails(employee);
  }

  // ==================== Custom Subscriptions ====================

  protected override setupCustomSubscriptions(): void {
    this.employeeFormService.activeEmployeeId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.employeeFormService.employeeCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.employeeFormService.employeeUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  public onNewEmployee(): void {
    this.onNewEmployeeClick.emit();
  }

  public refreshList(): void {
    this.refreshData();
  }

  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  public clearSearchTerm(): void {
    this.clearSearch();
  }

  showConfirmDialog() {
    return !!this.confirmDialogVisible;
  }

  confirmDialogData() {
    return this.confirmDialogDataValue || {};
  }

  onConfirmDialogConfirm() {
    if (this.confirmDialogAction) {
      this.confirmDialogAction();
    }
    this.confirmDialogVisible = false;
  }

  onConfirmDialogCancel() {
    this.confirmDialogVisible = false;
    this.confirmDialogAction = null;
  }
}