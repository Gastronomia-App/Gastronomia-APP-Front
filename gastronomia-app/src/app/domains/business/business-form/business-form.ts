import { Component, inject, output, viewChild, OnInit } from '@angular/core';
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

  // Output
  onFormClosed = output<void>();

  // State
  editingBusinessId: number | null = null;
  isEditMode = false;

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
            placeholder: 'XX-XXXXXXXX-X',
            helpText: 'Formato: XX-XXXXXXXX-X',
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
    // Initialization can be done here if needed
  }

  /**
   * Manejar el envío del formulario
   */
  onFormSubmit(event: FormSubmitEvent<Partial<Business>>): void {
    const formData: Partial<Business> = {
      name: event.data.name || '',
      cuit: event.data.cuit || '',
      address: event.data.address || {
        street: '',
        city: '',
        province: '',
        zipCode: ''
      }
    };

    if (event.isEditMode && event.editingId) {
      console.log(`📤 PATCH /api/businesses/${event.editingId} - Request:`, formData);
      this.businessService.updateBusiness(Number(event.editingId), formData).subscribe({
        next: (business) => {
          console.log(`📥 PATCH /api/businesses/${event.editingId} - Response:`, business);
          this.businessFormService.notifyBusinessUpdated(business);
          this.resetForm();
          this.onClose();
          this.businessFormService.viewBusinessDetails(business);
        },
        error: (error) => {
          console.error(`❌ PATCH /api/businesses/${event.editingId} - Error:`, error);
        },
      });
    } else {
      // Crear nuevo negocio (sin owner, solo para usuarios ya autenticados)
      // La creación completa con owner se hace en /register
      console.log('⚠️ Creación de negocio sin owner requiere endpoint diferente en el backend');
      // TODO: Implementar cuando el backend tenga el endpoint
      this.onFormCancel();
    }
  }

  /**
   * Cargar datos del negocio para edición
   */
  loadBusiness(business: Business): void {
    this.isEditMode = true;
    this.editingBusinessId = business.id;

    const businessData: any = {
      name: business.name,
      cuit: business.cuit,
      'address.street': business.address.street,
      'address.city': business.address.city,
      'address.province': business.address.province,
      'address.zipCode': business.address.zipCode
    };

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(businessData);
    }
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.isEditMode = false;
    this.editingBusinessId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  /**
   * Cancelar edición
   */
  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  /**
   * Cerrar el formulario
   */
  onClose(): void {
    this.onFormClosed.emit();
  }
}
