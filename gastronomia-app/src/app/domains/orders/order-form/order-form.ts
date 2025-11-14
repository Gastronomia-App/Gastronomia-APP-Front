import {
  Component, inject, input, output, OnInit, AfterViewInit,
  signal, viewChild,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { CustomersService } from '../../customer/services/customers-service';
import { EmployeeService } from '../../employees';
import { OrderService } from '../services/order.service';
import { Customer, Employee, FormConfig, Order } from '../../../shared/models';
import { Form } from '../../../shared/components/form';
import { SearchableEntity } from '../../../shared/components/searchable-entity/searchable-entity';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderForm implements OnInit, AfterViewInit {
  private readonly customerService = inject(CustomersService);
  private readonly employeeService = inject(EmployeeService);
  private readonly orderService = inject(OrderService);

  orderClosed = output<void>();
  orderCreated = output<void>();

  seatingId = input.required<number>();

  readonly customers = signal<Array<Customer & { name: string }>>([]);
  readonly employees = signal<Employee[]>([]);
  readonly isLoadingCustomers = signal(true);
  readonly isLoadingEmployees = signal(true);
  readonly selectedCustomer = signal<Customer | null>(null);

  formRef = viewChild(Form);

  readonly formConfig = signal<FormConfig<Order>>({
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
            max: 20,
            step: 1,
            helpText: 'Número de personas en la mesa.'
          },
          {
            name: 'customerId',
            label: 'Cliente (opcional)',
            type: 'custom',
            // required: true,  // <-- removed: customer is optional now
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

  ngOnInit(): void {
    this.loadEmployees();
    this.loadCustomers();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.formRef()?.renderDynamicComponents();

      // Create 'customerId' control WITHOUT validators (optional field)
      const form = this.formRef()?.form;
      if (form && !form.get('customerId')) {
        form.addControl('customerId', new FormControl<number | null>(null));
      }

      this.refreshCustomerSearchInput();
    });
  }

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
        queueMicrotask(() => this.formRef()?.renderDynamicComponents());
      }
    });
  }

  onCancel(): void {
    this.orderClosed.emit();
  }

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
  }

  private onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    const form = this.formRef()?.form;
    const id = Number((customer as any).id);
    form?.get('customerId')?.setValue(id);
    form?.get('customerId')?.markAsDirty();
    form?.get('customerId')?.markAsTouched();
  }

  private onCustomerCleared(): void {
    this.selectedCustomer.set(null);
    const form = this.formRef()?.form;
    form?.get('customerId')?.setValue(null);
    form?.get('customerId')?.markAsDirty();
    form?.get('customerId')?.markAsTouched();
  }

  onSubmit(event: { data: Order }): void {
    const form = this.formRef()?.form;

    // Read and normalize values
    const customerIdCtrl = form?.get('customerId')?.value;
    const employeeIdRaw = (event.data as any).employeeId;

    // Build payload: omit customerId if empty
    const payload: any = {
      ...event.data,
      seatingId: this.seatingId(),
      orderType: 'TABLE',
      employeeId: employeeIdRaw != null ? Number(employeeIdRaw) : undefined
    };

    if (customerIdCtrl == null) {
      // Do not send customerId at all if user didn't pick one
      delete payload.customerId;
    } else {
      payload.customerId = Number(customerIdCtrl);
    }

    this.orderService.createOrder(payload).pipe(take(1)).subscribe({
      next: () => this.orderCreated.emit(),
      error: (err) => console.error('Error creating order', err)
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seatingId'] && !changes['seatingId'].firstChange) {
      this.selectedCustomer.set(null);
      this.rebuildFormConfig();
    }
  }

  private clearFormForNewSeating(): void {
    const form = this.formRef()?.form;
    if (!form) return;

    // Reset with defaults; customer remains null (optional)
    form.reset({
      orderType: 'TABLE',
      peopleCount: null,
      employeeId: null,
      customerId: null
    });

    const customerCtrl = form.get('customerId');
    if (customerCtrl) {
      customerCtrl.setValue(null);
      customerCtrl.markAsPristine();
      customerCtrl.markAsUntouched();
      customerCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private rebuildFormConfig(): void {
    const newConfig: FormConfig<Order> = {
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
              max: 20,
              step: 1,
              helpText: 'Número de personas en la mesa.'
            },
            {
              name: 'customerId',
              label: 'Cliente (opcional)',
              type: 'custom',
              // required: true, // <-- keep it optional
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

    this.formConfig.set(newConfig);

    queueMicrotask(() => {
      this.formRef()?.renderDynamicComponents();

      const form = this.formRef()?.form;
      // Recreate optional control (no validators)
      if (form && !form.get('customerId')) {
        form.addControl('customerId', new FormControl<number | null>(null));
      }

      this.clearFormForNewSeating();
    });
  }
}
