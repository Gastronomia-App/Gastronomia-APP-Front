import { Component, OnInit, signal } from '@angular/core';
import { CustomersService } from '../../services/customers-service';
import { CustomersTable } from '../../components/customers-table/customers-table';
import { CustomersForm } from "../../components/customers-form/customers-form";
import { Customer, CustomerFilter } from '../../../../shared/models';

@Component({
  selector: 'app-customer-page',
  imports: [CustomersTable, CustomersForm],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.css',
})
export class CustomerPage implements OnInit {

  customers = signal<Customer[]>([]);
  loading = signal<boolean>(true);
  showForm = signal<boolean>(false);
  selectedCustomer = signal<Customer | null>(null); 
  
  constructor(private customerService: CustomersService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

 loadCustomers(filters: CustomerFilter = {}): void {
  this.loading.set(true);

  this.customerService.search().subscribe({
    next: (res) => {
      let customers = res as Customer[];

      if (filters.name) {
        const term = filters.name.toLowerCase();
        customers = customers.filter(c =>
          c.name?.toLowerCase().includes(term) ||
          c.lastName?.toLowerCase().includes(term) ||
          c.dni?.includes(term) ||
          c.email.toLowerCase().includes(term)
        );
      }

      this.customers.set(customers);
      this.loading.set(false);
    },
    error: () => {this.loading.set(false)}
  })
 }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.selectedCustomer.set(null); 
    }
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value.length === 0) {
      this.loadCustomers();
      return;
    }

    this.loadCustomers({
      name: value,
      lastName: value,
      dni: value,
      email: value,
    });
  }


  clearSearch(input: HTMLInputElement): void {
    input.value = '';     
    this.loadCustomers(); 
  }

  reloadTable(): void {
  this.loadCustomers();
  }



onDeleteCustomer(customer: Customer): void {
  const confirmDelete = confirm(`¿Seguro que querés eliminar a ${customer.name} ${customer.lastName}?`);
  if (!confirmDelete) return;

  this.customerService.delete(customer.id!).subscribe({
    next: () => {
      console.log('Cliente eliminado:', customer);
      this.loadCustomers(); 
    },
    error: (err) => {
      console.error('Error al eliminar cliente', err);
    }
  });

  }

  onEditCustomer(customer: Customer): void {
    console.log('Cliente a editar:', customer);
    this.selectedCustomer.set(customer);
    this.showForm.set(true);
}

 onCancel(): void {
    this.showForm.set(false);
    this.selectedCustomer.set(null);
  }

  onNewCustomer(): void {
  this.selectedCustomer.set(null);
  this.showForm.set(true);
  }

}