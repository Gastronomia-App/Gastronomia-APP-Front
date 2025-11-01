import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { EmployeesList } from '../employees-list/list-employees';
import { EmployeeForm } from '../employees-form/create-employee';
import { EmployeesDetail } from '../employees-detail/employees-detail';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee } from '../../../shared/models';

@Component({
  selector: 'app-employees-page',
  imports: [EmployeeForm, EmployeesDetail, EmployeesList],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.css',
})
export class EmployeesPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(EmployeesList) employeeTable?: EmployeesList;
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
    // Subscribe to employee form service events
    this.subscriptions.add(
      this.employeeFormService.editEmployee$.subscribe((employee) => {
        this.showEmployeeDetails.set(false);
        this.currentEmployeeId = employee.id;
        this.pendingEmployee = employee;
        this.showEmployeeForm.set(true);
      })
    );

    this.subscriptions.add(
      this.employeeFormService.viewEmployeeDetails$.subscribe((employee) => {
        // Toggle details if same employee
        if (this.currentEmployeeId === employee.id && this.showEmployeeDetails()) {
          this.closeEmployeeDetails();
        } else {
          this.showEmployeeForm.set(false);
          this.currentEmployeeId = employee.id;
          this.employeeFormService.setActiveEmployeeId(employee.id);
          this.pendingDetailsEmployee = employee;
          this.showEmployeeDetails.set(true);
        }
      })
    );

    this.subscriptions.add(
      this.employeeFormService.closeDetails$.subscribe(() => {
        this.showEmployeeDetails.set(false);
        this.showEmployeeForm.set(false);
        this.currentEmployeeId = null;
        this.employeeFormService.setActiveEmployeeId(null);
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
