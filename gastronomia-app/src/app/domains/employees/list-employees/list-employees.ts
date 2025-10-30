import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeApi } from '../services/employee-api';
import { Employee } from '../../../shared/models/employee.model';
import { TableColumn } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';

@Component({
  selector: 'app-list-employees',
  standalone: true,
  templateUrl: './list-employees.html',
  styleUrl: './list-employees.css',
  imports: [CommonModule, Table]
})
export class ListEmployeesComponent extends BaseTable<Employee> {
  private api = inject(EmployeeApi);
  private router = inject(Router);

  // Output events para comunicación con el padre
  onEmployeeSelected = output<Employee>();
  onNewEmployeeClick = output<void>();

  override highlightedRowId: number | null = null;

  constructor() {
    super();
    console.log('🔧 ListEmployeesComponent constructor');
    
    // Configure page size
    this.tableService.setPageSize(10);
    
    // Set custom filter function for employees
    this.tableService.setFilterFunction((employee, term) => {
      const searchTerm = term.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.lastName.toLowerCase().includes(searchTerm) ||
        employee.username.toLowerCase().includes(searchTerm) ||
        employee.dni.toLowerCase().includes(searchTerm) ||
        (employee.email?.toLowerCase().includes(searchTerm) ?? false)
      );
    });
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<Employee>[] {
    return [
      {
        header: 'ID',
        field: 'id',
        sortable: true,
        align: 'center',
        width: '100px'
      },
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'center',
        width: '250px'
      },
      {
        header: 'Apellido',
        field: 'lastName',
        sortable: true,
        align: 'center',
        width: '250px'
      },
      {
        header: 'Teléfono',
        field: 'phoneNumber',
        sortable: false,
        align: 'center',
        width: '250px'
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    console.log(`📡 Fetching employees: page=${page}, size=${size}`);
    return this.api.list(page, size, 'id,asc');
  }

  protected fetchItemById(id: number) {
    return this.api.getById(id);
  }

  protected deleteItem(id: number) {
    return this.api.delete(id);
  }

  protected getItemName(employee: Employee): string {
    return `${employee.name} ${employee.lastName}`;
  }

  protected getItemId(employee: Employee): number {
    return employee.id;
  }

  protected onEditItem(employee: Employee): void {
    // Navigate to edit page or open edit form
    this.router.navigate(['/employees', employee.id, 'edit']);
  }

  protected onViewDetails(employee: Employee): void {
    // Navigate to details page or emit event
    this.onEmployeeSelected.emit(employee);
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Employee)
   * Navigate to create employee page
   */
  public onNewEmployee(): void {
    this.router.navigate(['/employees/new']);
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
    this.searchTerm = term;
    this.onSearch();
  }

  /**
   * Permite al componente padre limpiar la búsqueda
   */
  public clearSearchTerm(): void {
    this.clearSearch();
  }
}