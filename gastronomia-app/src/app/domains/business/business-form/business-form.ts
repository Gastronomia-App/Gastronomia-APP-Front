import { Component, inject, input, output, viewChild, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { FormConfig, FormSubmitEvent, Business } from '../../../shared/models';
import { BusinessService } from '../services/business.service';
import { BusinessFormService } from '../services/business-form.service';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './business-form.html',
  styleUrl: './business-form.css',
  host: {
    class: 'entity-form'
  }
})
export class BusinessForm implements OnInit {
  private businessService = inject(BusinessService);
  private businessFormService = inject(BusinessFormService);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  constructor() {
    // Control form disabled state based on edit mode
    effect(() => {
      const formComp = this.formComponent();
      const editMode = this.isEditMode();
      
      if (formComp?.form) {
        if (editMode) {
          formComp.form.enable();
        } else {
          formComp.form.disable();
        }
      }
    });
  }

  // Inputs
  isEditMode = input<boolean>(false);
  editingBusinessId = input<number | null>(null);
  businessData = input<Business | null>(null);

  // Outputs
  formSubmit = output<FormSubmitEvent<Partial<Business>>>();
  formCancel = output<void>();

  // Form configuration
  formConfig: FormConfig<Partial<Business>> = {
    sections: [
      {
        title: 'Datos del negocio',
        fields: [
          {
            name: 'name',
            label: 'Nombre del negocio',
            type: 'text',
            required: true,
            placeholder: 'Ej: Café Central',
            helpText: 'Nombre que identificará tu negocio',
            fullWidth: true,
          },
          {
            name: 'cuit',
            label: 'CUIT',
            type: 'text',
            required: true,
            placeholder: '20123456789',
            helpText: 'Introducir números sin espacios ni guiones',
            fullWidth: true,
          },
        ],
      },
      {
        title: 'Dirección',
        fields: [
          {
            name: 'address.street',
            label: 'Calle',
            type: 'text',
            required: true,
            placeholder: 'Av. Corrientes 1234',
            fullWidth: true,
          },
          {
            name: 'address.city',
            label: 'Ciudad',
            type: 'text',
            required: true,
            placeholder: 'Buenos Aires',
          },
          {
            name: 'address.province',
            label: 'Provincia',
            type: 'text',
            required: true,
            placeholder: 'Buenos Aires',
          },
          {
            name: 'address.zipCode',
            label: 'Código Postal',
            type: 'text',
            required: true,
            placeholder: '1406',
            helpText: 'Código postal de 4 dígitos',
          },
        ],
      },
    ],
    submitLabel: 'Crear',
    cancelLabel: 'Cancelar',
    showCancelButton: true,
    title: 'Nuevo negocio',
    editTitle: 'Editar negocio',
  };

  ngOnInit(): void {
    // Load business data when component initializes
    const business = this.businessData();
    if (business) {
      const data: any = {
        name: business.name,
        cuit: business.cuit,
        'address.street': business.address.street,
        'address.city': business.address.city,
        'address.province': business.address.province,
        'address.zipCode': business.address.zipCode
      };

      // Load data into form component and set initial disabled state
      setTimeout(() => {
        const formComp = this.formComponent();
        if (formComp) {
          formComp.loadData(data);
          
          // Set initial disabled state
          if (!this.isEditMode()) {
            formComp.form.disable();
          }
        }
      });
    }
  }

  /**
   * Manejar el envío del formulario - emit to parent
   */
  handleFormSubmit(event: FormSubmitEvent<Partial<Business>>): void {
    this.formSubmit.emit(event);
  }

  /**
   * Cancelar edición - emit to parent
   */
  handleFormCancel(): void {
    this.formCancel.emit();
  }
}
