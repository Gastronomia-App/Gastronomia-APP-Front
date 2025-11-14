import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { Customer } from '../../../shared/models';
import { CustomerFormService } from '../services/CustomerFormService';
import { CommonModule } from '@angular/common';
import { CustomerTable } from '../customer-table/customer-table';
import { CustomerForm } from '../customer-form/customer-form';
import { CustomerDetails } from '../customer-detail/customer-detail';

@Component({
  selector: 'app-customer-page',
  standalone: true,
  imports: [CustomerTable, CustomerForm, CustomerDetails, CommonModule],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.css',
})
export class CustomerPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(CustomerTable) customerList?: CustomerTable;
  @ViewChild(CustomerForm) customerFormComponent?: CustomerForm;
  @ViewChild(CustomerDetails) customerDetailsComponent?: CustomerDetails;

  private customerFormService = inject(CustomerFormService);
  private subscriptions = new Subscription();
  private pendingCustomer?: Customer;
  private pendingDetailsCustomer?: Customer;

  // === UI State (reemplaza showForm/showDetails signals viejos)
  showCustomerForm = signal(false);
  showCustomerDetails = signal(false);
  currentCustomerId: number | null = null;

  ngOnInit(): void {
    // ====== Abrir formulario en modo edición ======
    this.subscriptions.add(
      this.customerFormService.editCustomer$.subscribe((customer) => {
        this.showCustomerDetails.set(false);
        this.currentCustomerId = customer.id;
        this.pendingCustomer = customer;
        this.showCustomerForm.set(true);
      })
    );

    // ====== Ver detalles ======
    this.subscriptions.add(
      this.customerFormService.viewCustomerDetails$.subscribe((customer) => {
        // Toggle: si hago click en el mismo cliente, cierro el detalle
        if (this.currentCustomerId === customer.id && this.showCustomerDetails()) {
          this.closeCustomerDetails();
        } else {
          this.showCustomerForm.set(false);
          this.currentCustomerId = customer.id;
          this.customerFormService.setActiveCustomerId(customer.id);
          this.pendingDetailsCustomer = customer;
          this.showCustomerDetails.set(true);
        }
      })
    );

    // ====== Cerrar todos los paneles ======
    this.subscriptions.add(
      this.customerFormService.closeDetails$.subscribe(() => {
        this.showCustomerDetails.set(false);
        this.showCustomerForm.set(false);
        this.currentCustomerId = null;
        this.customerFormService.setActiveCustomerId(null);
      })
    );
  }

  ngAfterViewChecked(): void {
    // Cargar datos en formulario pendiente
    if (this.pendingCustomer && this.customerFormComponent) {
      this.customerFormComponent.loadCustomer(this.pendingCustomer);
      this.pendingCustomer = undefined;
    }

    // Cargar datos en detalle pendiente
    if (this.pendingDetailsCustomer && this.customerDetailsComponent) {
      this.customerDetailsComponent.loadCustomer(this.pendingDetailsCustomer);
      this.pendingDetailsCustomer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== FORM / DETALLES ====================

  openCustomerForm(): void {
    this.showCustomerDetails.set(false);
    this.showCustomerForm.set(true);
    this.currentCustomerId = null;
    this.customerFormService.setActiveCustomerId(null);

    // 🔹 Si vengo de un cliente en edición, reinicia el formulario
    setTimeout(() => {
      if (this.customerFormComponent) {
        this.customerFormComponent.resetForm();
      }
    }, 0);
  }

  closeCustomerForm(): void {
  this.showCustomerForm.set(false);
  this.currentCustomerId = null;
  this.customerFormService.setActiveCustomerId(null);
}

  closeCustomerDetails(): void {
    this.showCustomerDetails.set(false);
    this.currentCustomerId = null;
    this.customerFormService.setActiveCustomerId(null);
  }
}