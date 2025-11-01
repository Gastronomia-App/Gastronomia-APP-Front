import { Component, inject, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-employees-detail',
  imports: [CommonModule, Detail],
  templateUrl: './employees-detail.html',
  styleUrl: './employees-detail.css',
  host: {
    class: 'entity-details'
  }
})
export class EmployeesDetail {
  private employeeFormService = inject(EmployeeFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  employee = signal<Employee | null>(null);
  
  // Computed
  roleLabel = computed(() => {
    const currentEmployee = this.employee();
    return currentEmployee ? this.getRoleLabel(currentEmployee.role) : '-';
  });

  constructor() {
    // Effect to re-render detail when employee changes
    effect(() => {
      const currentEmployee = this.employee();
      // Track dependency
      if (currentEmployee) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Employee> = {
    title: 'Detalles del empleado',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información personal',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text'
          },
          {
            name: 'lastName',
            label: 'Apellido',
            type: 'text'
          },
          {
            name: 'dni',
            label: 'DNI',
            type: 'text'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text'
          },
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text'
          }
        ]
      },
      {
        title: 'Información de acceso',
        fields: [
          {
            name: 'username',
            label: 'Usuario',
            type: 'text'
          },
          {
            name: 'role',
            label: 'Rol',
            type: 'text',
            formatter: () => this.roleLabel()
          },
          {
            name: 'deleted',
            label: 'Estado',
            type: 'badge',
            cssClass: 'inline-field',
            booleanLabels: {
              true: 'Inactivo',
              false: 'Activo'
            }
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
        label: 'Editar',
        type: 'primary',
        handler: () => this.onEdit()
      }
    ]
  };

  loadEmployee(employee: Employee): void {
    this.employee.set(employee);
  }

  onEdit(): void {
    const currentEmployee = this.employee();
    if (currentEmployee) {
      this.employeeFormService.openEditForm(currentEmployee);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }

  private getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'OWNER': 'Propietario',
      'ADMIN': 'Administrador',
      'CASHIER': 'Cajero',
      'WAITER': 'Mozo'
    };
    return roleLabels[role] || role;
  }
}
