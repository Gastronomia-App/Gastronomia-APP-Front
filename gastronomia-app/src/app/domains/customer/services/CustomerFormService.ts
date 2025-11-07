import { BehaviorSubject, Subject } from "rxjs";
import { Customer } from "../../../shared/models";
import { Injectable } from "@angular/core";



@Injectable({
  providedIn: 'root'
})
export class CustomerFormService {
  private openFormSubject = new Subject<void>();
  private editCustomerSubject = new Subject<Customer>();
  private viewCustomerDetailsSubject = new Subject<Customer>();
  private closeDetailsSubject = new Subject<void>();
  private customerCreatedSubject = new Subject<Customer>();
  private customerUpdatedSubject = new Subject<Customer>();
  private activeCustomerIdSubject = new BehaviorSubject<number | null>(null);

  // === Observables públicos ===
  openForm$ = this.openFormSubject.asObservable();
  editCustomer$ = this.editCustomerSubject.asObservable();
  viewCustomerDetails$ = this.viewCustomerDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  customerCreated$ = this.customerCreatedSubject.asObservable();
  customerUpdated$ = this.customerUpdatedSubject.asObservable();
  activeCustomerId$ = this.activeCustomerIdSubject.asObservable();

  // === Métodos de control ===

  /** 🔹 Abre el formulario vacío (modo creación) */
  openForm(): void {
    this.openFormSubject.next();
    this.activeCustomerIdSubject.next(null);
  }

  /** 🔹 Abre el formulario en modo edición */
  editCustomer(customer: Customer): void {
    this.editCustomerSubject.next(customer);
    this.activeCustomerIdSubject.next(customer.id);
  }

  /** 🔹 Alias más semántico para edición */
  openEditForm(customer: Customer): void {
    this.editCustomerSubject.next(customer);
    this.activeCustomerIdSubject.next(customer.id);
  }

  /** 🔹 Abre el panel de detalles */
  viewCustomerDetails(customer: Customer): void {
    this.viewCustomerDetailsSubject.next(customer);
    // ⚠️ No seteamos activeId acá, se maneja en customer-page
  }

  /** 🔹 Cierra todos los paneles */
  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeCustomerIdSubject.next(null);
  }

  /** 🔹 Establece manualmente el ID activo */
  setActiveCustomerId(id: number | null): void {
    this.activeCustomerIdSubject.next(id);
  }

  /** 🔹 Emite evento al crear un cliente */
  notifyCustomerCreated(customer: Customer): void {
    this.customerCreatedSubject.next(customer);
  }

  /** 🔹 Emite evento al actualizar un cliente */
  notifyCustomerUpdated(customer: Customer): void {
    this.customerUpdatedSubject.next(customer);
  }
}