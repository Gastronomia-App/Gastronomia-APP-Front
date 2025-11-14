import {
  Component, inject, input, output, OnInit, AfterViewInit,
  signal, viewChild, SimpleChanges
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

  editingOrder = input<Order | null>(null);

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
            step: 1
          },
          {
            name: 'customerId',
            label: 'Cliente (opcional)',
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
    const form = this.formRef()?.form;
    if (!form) return;

    if (!form.get('customerId')) {
      form.addControl('customerId', new FormControl<number | null>(null));
    }

    if (this.editingOrder()) {
      const order = this.editingOrder()!;

      form.patchValue({
        peopleCount: order.peopleCount,
        customerId: order.customerId ?? null,
        employeeId: order.employeeId ?? null,
        orderType: order.orderType
      });

      if (order.customerId) {
        const found = this.customers().find(c => c.id === order.customerId);
        if (found) this.selectedCustomer.set(found);
      }

      this.formConfig.update(cfg => ({
        ...cfg,
        title: 'Editar Orden',
        submitLabel: 'Guardar Cambios'
      }));
    }
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
    form?.get('customerId')?.setValue(customer.id);
  }

  private onCustomerCleared(): void {
    this.selectedCustomer.set(null);
    const form = this.formRef()?.form;
    form?.get('customerId')?.setValue(null);
  }

  onSubmit(event: { data: Order }): void {
    const form = this.formRef()?.form;
    if (!form) return;

    const customerIdCtrl = form.get('customerId')?.value;
    const employeeIdRaw = event.data.employeeId;

    const payload: any = {
      ...event.data,
      seatingId: this.seatingId(),
      orderType: 'TABLE',
      customerId: customerIdCtrl ?? null,
      employeeId: employeeIdRaw != null ? Number(employeeIdRaw) : null
    };

    // --- EDIT MODE ---
    if (this.editingOrder()) {
      this.orderService.updateOrder(
        Number(this.editingOrder()!.id),
        payload
      )
      .pipe(take(1))
      .subscribe({
        next: () => this.orderCreated.emit(),
        error: (err) => console.error('Error updating order', err)
      });
      return;
    }

    // --- CREATE MODE ---
    this.orderService.createOrder(payload)
      .pipe(take(1))
      .subscribe({
        next: () => this.orderCreated.emit(),
        error: (err) => console.error('Error creating order', err)
      });
  }

  onCancel(): void {
    this.orderClosed.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seatingId'] && !changes['seatingId'].firstChange) {
      this.selectedCustomer.set(null);
    }
  }
}
