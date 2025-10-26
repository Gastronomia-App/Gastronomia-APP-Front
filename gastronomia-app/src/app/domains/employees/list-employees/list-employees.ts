import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { Employee } from '../../../core/models/employee.model';
import { EmployeeApi } from '../services/employee-api';

@Component({
  selector: 'app-list-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-employees.html',
  styleUrl: './list-employees.css'
})
export class ListEmployeesComponent implements OnInit {
  private api = inject(EmployeeApi);

  employees: Employee[] = [];
  filtered: Employee[] = [];

  loading = false;
  errorMsg = '';
  q = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';

    this.api.findAll()
      .pipe(
        catchError(() => {
          this.errorMsg = 'No se pudo cargar la lista de empleados.';
          return of([] as Employee[]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((data) => {
        this.employees = data ?? [];
        this.applyFilter();
      });
  }

  applyFilter(): void {
    const term = this.q.trim().toLowerCase();
    if (!term) {
      this.filtered = [...this.employees];
      return;
    }

    this.filtered = this.employees.filter(e => {
      const check = (v?: string | number | boolean) =>
        (v ?? '').toString().toLowerCase().includes(term);

      return (
        check(e.name) ||
        check(e.lastname) ||
        check(e.username) ||
        check(e.dni)
      );
    });
  }

  resetFilter(): void {
    this.q = '';
    this.applyFilter();
  }

  isActive(e: Employee): boolean {
    return !e.deleted;
  }
}