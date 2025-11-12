import {
  Component, inject, input, output, OnInit, AfterViewInit,
  signal, viewChild,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { CustomersService } from '../../../customer/services/customers-service';
import { EmployeeService } from '../../../employees';
import { OrderService } from '../../services/order.service';
import { Customer, Employee, FormConfig } from '../../../../shared/models';
import { CreateOrderRequest } from '../../../../shared/models/order.model';
import { SearchableList } from '../../../../shared/components/searchable-list';
import { Form } from '../../../../shared/components/form';
import { SearchableEntity } from '../../../../shared/components/searchable-entity/searchable-entity';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderForm implements OnInit, AfterViewInit {
  // Dependency injection
  private readonly customerService = inject(CustomersService);
  private readonly employeeService = inject(EmployeeService);
  private readonly orderService = inject(OrderService);

  // Outputs
  orderClosed = output<void>();
  orderCreated = output<void>();

  // Inputs
  seatingId = input.required<number>();

  // Signals for data and state management
  readonly customers = signal<Array<Customer & { name: string }>>([]);
  readonly employees = signal<Employee[]>([]);
  readonly isLoadingCustomers = signal(true);
  readonly isLoadingEmployees = signal(true);

  // Currently selected customer
  readonly selectedCustomer = signal<Customer | null>(null);

  // Reference to dynamic form component
  formRef = viewChild(Form);

  // Form configuration signal
  readonly formConfig = signal<FormConfig<CreateOrderRequest>>({
    title: 'Nueva Orden',
    submitLabel: 'Crear Orden',
    sections: [
      {
        fields: [
          {
            name: 'peopleCount',
            label: 'Cantidad de personas',
            type: 'number',
            required: true,
            min: 1,
            max: 10,
            step: 1,
            helpText: 'Número de personas en la mesa.'
          },
          {
            name: 'customerId',
            label: 'Cliente',
            type: 'custom',
            fullWidth: true,
            customComponent: SearchableEntity,
            customInputs: {
              placeholder: 'Buscar cliente...',
              availableItems: this.customers(),
              selectedItem: this.selectedCustomer(),
              isLoading: this.isLoadingCustomers()
            },
            customOutputs: {
              itemSelected: (customer: Customer & { name: string }) => this.onCustomerSelected(customer),
              itemCleared: () => this.onCustomerCleared()
            }
          },
          {
            name: 'employeeId',
            label: 'Camarero',
            type: 'select',
            required: true,
            options: []
          },
          {
            name: 'orderType',
            label: 'Tipo de orden',
            type: 'text',
            readonly: true,
            defaultValue: 'TABLE'
          }
        ]
      }
    ]
  });

  // Lifecycle hook - initialization
  ngOnInit(): void {
    this.loadEmployees();
    this.loadCustomers();
  }

  // Lifecycle hook - after view initialization
  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.formRef()?.renderDynamicComponents();
      this.refreshCustomerSearchInput();
    });
  }

  // ===================== LOADERS =====================

  // Load employee options for the form
  private loadEmployees(): void {
    this.isLoadingEmployees.set(true);
    this.employeeService.getEmployees().pipe(take(1)).subscribe({
      next: (emps) => {
        this.employees.set(emps ?? []);
        const cfg = this.formConfig();
        const empField = cfg.sections[0].fields.find(f => f.name === 'employeeId');
        if (empField) {
          empField.options = this.employees().map(e => ({
            label: `${e.name} ${e.lastName}`,
            value: e.id
          }));
          this.formConfig.set({ ...cfg });
        }
      },
      complete: () => this.isLoadingEmployees.set(false)
    });
  }

  // Load customers for the searchable field
  private loadCustomers(): void {
    this.isLoadingCustomers.set(true);
    this.customerService.search({}, 0, 50).pipe(take(1)).subscribe({
      next: (res) => {
        const mapped = (res.content ?? []).map((c: any) => ({
          ...c,
          name: `${c.name ?? c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
        }));
        this.customers.set(mapped);
      },
      complete: () => {
        this.isLoadingCustomers.set(false);
        this.refreshCustomerSearchInput();
      }
    });
  }

  // ===================== CANCEL HANDLER =====================

  // Emit close event to parent component
  onCancel(): void {
    this.orderClosed.emit();
  }

  // ===================== REFRESH =====================

  // Refreshes the customer search input with updated data
  private refreshCustomerSearchInput(): void {
    const cfg = this.formConfig();
    const field = cfg.sections[0].fields.find(f => f.name === 'customerId');
    if (!field) return;

    field.customInputs = {
      placeholder: 'Buscar cliente...',
      availableItems: this.customers(),
      selectedItem: this.selectedCustomer(),
      isLoading: this.isLoadingCustomers()
    };

    this.formConfig.set({ ...cfg });
    queueMicrotask(() => this.formRef()?.renderDynamicComponents());
  }

  // ===================== CUSTOMER HANDLERS =====================

  // When a customer is selected
  private onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.formRef()?.form.patchValue({ customerId: (customer as any).id });
    this.refreshCustomerSearchInput();
  }

  // When the customer selection is cleared
  private onCustomerCleared(): void {
    this.selectedCustomer.set(null);
    this.formRef()?.form.patchValue({ customerId: null });
    this.refreshCustomerSearchInput();
  }

  // ===================== SUBMIT =====================

  // Handles form submission and order creation
  onSubmit(event: { data: CreateOrderRequest }): void {
    const dto: CreateOrderRequest = {
      ...event.data,
      seatingId: this.seatingId(),
      orderType: 'TABLE'
    };

    this.orderService.createOrder(dto).pipe(take(1)).subscribe({
      next: () => this.orderCreated.emit(),
      error: (err) => console.error('Error creating order', err)
    });

    console.log('Order:', dto);
  }

  // ===================== INPUT CHANGES =====================

  // Detects input changes and rebuilds form when the seating ID changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seatingId'] && !changes['seatingId'].firstChange) {
      console.log('Seating changed, resetting form');
      this.selectedCustomer.set(null);
      this.rebuildFormConfig();
    }
  }

  // ===================== FORM REBUILD =====================

  // Fully rebuilds form configuration when a new seating is selected
  private rebuildFormConfig(): void {
    const newConfig: FormConfig<CreateOrderRequest> = {
      title: 'Nueva Orden',
      submitLabel: 'Crear Orden',
      sections: [
        {
          fields: [
            {
              name: 'peopleCount',
              label: 'Cantidad de personas',
              type: 'number',
              required: true,
              min: 1,
              max: 10,
              step: 1,
              helpText: 'Número de personas en la mesa.'
            },
            {
              name: 'customerId',
              label: 'Cliente',
              type: 'custom',
              fullWidth: true,
              customComponent: SearchableEntity,
              customInputs: {
                placeholder: 'Buscar cliente...',
                availableItems: this.customers(),
                selectedItem: this.selectedCustomer(),
                isLoading: this.isLoadingCustomers()
              },
              customOutputs: {
                itemSelected: (customer: Customer & { name: string }) =>
                  this.onCustomerSelected(customer),
                itemCleared: () => this.onCustomerCleared()
              }
            },
            {
              name: 'employeeId',
              label: 'Camarero',
              type: 'select',
              required: true,
              options: this.employees().map(e => ({
                label: `${e.name} ${e.lastName}`,
                value: e.id
              }))
            },
            {
              name: 'orderType',
              label: 'Tipo de orden',
              type: 'text',
              readonly: true,
              defaultValue: 'TABLE'
            }
          ]
        }
      ]
    };

    // Replace the signal’s value to trigger full re-render
    this.formConfig.set(newConfig);

    // Wait for the view to stabilize before re-rendering dynamic components
    queueMicrotask(() => this.formRef()?.renderDynamicComponents());
  }
}
