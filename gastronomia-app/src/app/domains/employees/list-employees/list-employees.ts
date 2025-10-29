import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApi, Page } from '../services/employee-api';
import { Employee } from '../../../shared/models/employee.model';

@Component({
  selector: 'app-list-employees',
  standalone: true,
  templateUrl: './list-employees.html',
  styleUrl: './list-employees.css',
  imports: [CommonModule, FormsModule]
})
export class ListEmployeesComponent implements OnInit {
  page?: Page<Employee>;
  loading = false;
  errorMsg = '';
  q = '';
  filtered: Employee[] = [];

  constructor(private api: EmployeeApi) {}

  ngOnInit() { this.load(); }

  load(page=0) {
    this.loading = true;
    this.errorMsg = '';
    this.api.list(page, 10, 'id,asc').subscribe({
      next: (p) => { 
        this.page = p; 
        this.filtered = p.content;
        this.loading = false; 
      },
      error: (e) => { 
        this.errorMsg = 'Error al cargar empleados';
        this.loading = false; 
      }
    });
  }

  applyFilter() {
    if (!this.page) return;
    const query = this.q.toLowerCase().trim();
    this.filtered = this.page.content.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.lastName.toLowerCase().includes(query) ||
      e.username.toLowerCase().includes(query) ||
      e.email?.toLowerCase().includes(query)
    );
  }

  resetFilter() {
    this.q = '';
    if (this.page) {
      this.filtered = this.page.content;
    }
  }

  isActive(e: Employee): boolean {
    return !e.deleted;
  }
}