import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { EmployeesTable } from '../employees-table/employees-table';
import { EmployeeForm } from '../employees-form/employee-form';
import { EmployeesDetail } from '../employees-detail/employees-detail';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee } from '../../../shared/models';

@Component({
  selector: 'app-employees-page',
  imports: [EmployeeForm, EmployeesDetail, EmployeesTable],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.css',
})
export class EmployeesPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(EmployeesTable) employeeTable?: EmployeesTable;
  @ViewChild(EmployeeForm) employeeFormComponent?: EmployeeForm;
  @ViewChild(EmployeesDetail) employeeDetailsComponent?: EmployeesDetail;
  
  private employeeFormService = inject(EmployeeFormService);
  private subscriptions = new Subscription();
  private pendingEmployee?: Employee;
  private pendingDetailsEmployee?: Employee;
  
  // UI state
  showEmployeeForm = signal(false);
  showEmployeeDetails = signal(false);
  currentEmployeeId: number | null = null;

  ngOnInit(): void {
    // Editar empleado
    this.subscriptions.add(
      this.employeeFormService.editEmployee$.subscribe((employee) => {
        this.showEmployeeDetails.set(false);
        this.currentEmployeeId = employee.id ?? null;
        this.pendingEmployee = employee;
        this.showEmployeeForm.set(true);
      })
    );

    // Ver detalles
    this.subscriptions.add(
      this.employeeFormService.viewEmployeeDetails$.subscribe((employee) => {
        if (this.currentEmployeeId === employee.id && this.showEmployeeDetails()) {
          this.closeEmployeeDetails();
        } else {
          this.showEmployeeForm.set(false);
          this.currentEmployeeId = employee.id ?? null;
          this.employeeFormService.setActiveEmployeeId(employee.id ?? null);
          this.pendingDetailsEmployee = employee;
          this.showEmployeeDetails.set(true);
        }
      })
    );

    // Cerrar detalles
    this.subscriptions.add(
      this.employeeFormService.closeDetails$.subscribe(() => {
        this.showEmployeeDetails.set(false);
        this.showEmployeeForm.set(false);
        this.currentEmployeeId = null;
        this.employeeFormService.setActiveEmployeeId(null);
      })
    );

    // 🔥 Cuando se crea un empleado → recargar tabla
    this.subscriptions.add(
      this.employeeFormService.employeeCreated$.subscribe(() => {
        this.employeeTable?.reloadFromPage();
      })
    );

    // 🔥 Cuando se actualiza un empleado → recargar tabla
    this.subscriptions.add(
      this.employeeFormService.employeeUpdated$.subscribe(() => {
        this.employeeTable?.reloadFromPage();
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.pendingEmployee && this.employeeFormComponent) {
      this.employeeFormComponent.loadEmployee(this.pendingEmployee);
      this.pendingEmployee = undefined;
    }

    if (this.pendingDetailsEmployee && this.employeeDetailsComponent) {
      this.employeeDetailsComponent.loadEmployee(this.pendingDetailsEmployee);
      this.pendingDetailsEmployee = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== Form and Panel Management ====================

  openEmployeeForm(): void {
    this.showEmployeeDetails.set(false);
    this.showEmployeeForm.set(true);
    this.currentEmployeeId = null;
    this.employeeFormService.setActiveEmployeeId(null);
    
    setTimeout(() => {
      if (this.employeeFormComponent) {
        this.employeeFormComponent.resetForm();
      }
    }, 0);
  }

  closeEmployeeForm(): void {
    this.showEmployeeForm.set(false);
    this.currentEmployeeId = null;
    this.employeeFormService.setActiveEmployeeId(null);
  }

  closeEmployeeDetails(): void {
    this.showEmployeeDetails.set(false);
    this.currentEmployeeId = null;
    this.employeeFormService.setActiveEmployeeId(null);
  }
}
