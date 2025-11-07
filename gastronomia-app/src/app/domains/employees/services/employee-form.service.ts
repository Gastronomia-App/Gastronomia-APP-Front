import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Employee } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeFormService {
  private openFormSubject = new Subject<void>();
  private editEmployeeSubject = new Subject<Employee>();
  private viewEmployeeDetailsSubject = new Subject<Employee>();
  private closeDetailsSubject = new Subject<void>();
  private employeeCreatedSubject = new Subject<Employee>();
  private employeeUpdatedSubject = new Subject<Employee>();
  private activeEmployeeIdSubject = new BehaviorSubject<number | null>(null);

  openForm$ = this.openFormSubject.asObservable();
  editEmployee$ = this.editEmployeeSubject.asObservable();
  viewEmployeeDetails$ = this.viewEmployeeDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  employeeCreated$ = this.employeeCreatedSubject.asObservable();
  employeeUpdated$ = this.employeeUpdatedSubject.asObservable();
  activeEmployeeId$ = this.activeEmployeeIdSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
    this.activeEmployeeIdSubject.next(null);
  }

  editEmployee(employee: Employee): void {
    this.editEmployeeSubject.next(employee);
    this.activeEmployeeIdSubject.next(employee.id);
  }

  openEditForm(employee: Employee): void {
    this.editEmployeeSubject.next(employee);
    this.activeEmployeeIdSubject.next(employee.id);
  }

  viewEmployeeDetails(employee: Employee): void {
    this.viewEmployeeDetailsSubject.next(employee);
  }

  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeEmployeeIdSubject.next(null);
  }

  setActiveEmployeeId(id: number | null): void {
    this.activeEmployeeIdSubject.next(id);
  }

  notifyEmployeeCreated(employee: Employee): void {
    this.employeeCreatedSubject.next(employee);
  }

  notifyEmployeeUpdated(employee: Employee): void {
    this.employeeUpdatedSubject.next(employee);
  }
}
