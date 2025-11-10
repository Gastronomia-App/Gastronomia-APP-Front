import { 
  Component, 
  inject, 
  OnInit, 
  output, 
  ChangeDetectorRef, 
  viewChild, 
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form/form';
import { SupplierService } from '../../../services/supplier.service';
import { SupplierFormService } from '../services';
import { Supplier, FormConfig, FormSubmitEvent } from '../../../shared/models';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.css',
})
export class SupplierForm implements OnInit {
  // ==================== Dependency Injection ====================
  
  private supplierService = inject(SupplierService);
  private supplierFormService = inject(SupplierFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // ==================== ViewChild Reference ====================
  
  // Reference to the generic Form component - REQUIRED for manual operations
  formComponent = viewChild(Form);

  // ==================== Outputs ====================
  
  onFormClosed = output<void>();

  // ==================== Edit Mode State ====================
  
  editingSupplierId: number | null = null;
  isEditMode = false;

  // ==================== Form Configuration ====================
  
  formConfig: FormConfig<Supplier> = {
    sections: [
      {
        title: 'Información Básica',
        fields: [
          {
            name: 'tradeName',
            label: 'Nombre Comercial',
            type: 'text',
            placeholder: 'Ej: Comercial XYZ',
            required: true,
            validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
            fullWidth: true,
            helpText: 'Nombre con el que opera el proveedor (obligatorio)'
          },
          {
            name: 'legalName',
            label: 'Razón Social',
            type: 'text',
            placeholder: 'Ej: Empresa S.A.',
            required: false,
            validators: [Validators.minLength(2), Validators.maxLength(150)],
            fullWidth: true,
            helpText: 'Razón social o nombre legal del proveedor'
          },
          {
            name: 'cuit',
            label: 'CUIT',
            type: 'text',
            placeholder: '12345678901',
            required: false,
            validators: [Validators.pattern(/^\d{11}$/)],
            fullWidth: false,
            helpText: 'Formato: 11 dígitos sin guiones'
          }
        ]
      },
      {
        title: 'Información de Contacto',
        fields: [
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text',
            placeholder: '+54 9 11 1234-5678',
            required: false,
            validators: [Validators.minLength(7), Validators.maxLength(20)],
            fullWidth: false,
            helpText: 'Número de contacto del proveedor'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'contacto@proveedor.com',
            required: false,
            validators: [Validators.email, Validators.maxLength(100)],
            fullWidth: false,
            helpText: 'Correo electrónico del proveedor'
          }
        ]
      },
      {
        title: 'Dirección',
        fields: [
          {
            name: 'street',
            label: 'Calle',
            type: 'text',
            placeholder: 'Ej: Av. Pedro Luro 1234',
            required: false,
            validators: [Validators.minLength(3), Validators.maxLength(100)],
            fullWidth: true,
            helpText: 'Calle y número'
          },
          {
            name: 'city',
            label: 'Ciudad',
            type: 'text',
            placeholder: 'Ej: Mar del Plata',
            required: false,
            validators: [Validators.minLength(2), Validators.maxLength(50)],
            fullWidth: false,
            helpText: 'Ciudad del proveedor'
          },
          {
            name: 'province',
            label: 'Provincia',
            type: 'text',
            placeholder: 'Ej: Buenos Aires',
            required: false,
            validators: [Validators.minLength(2), Validators.maxLength(50)],
            fullWidth: false,
            helpText: 'Provincia o estado'
          },
          {
            name: 'zipCode',
            label: 'Código Postal',
            type: 'text',
            placeholder: 'Ej: 7600',
            required: false,
            validators: [Validators.minLength(3), Validators.maxLength(10)],
            fullWidth: false,
            helpText: 'Código postal'
          }
        ]
      }
    ]
  };

  // ==================== Lifecycle Hooks ====================
  
  ngOnInit(): void {
    // No additional initialization needed
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Supplier>): void {
    // Transform form data to match API expectations
    const data = event.data as any;
    const formData: any = {
      tradeName: data.tradeName?.trim(),
      legalName: data.legalName?.trim() || null,
      cuit: data.cuit?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
      email: data.email?.trim() || null,
      address: null
    };

    // Handle address fields (they come directly in event.data, not nested)
    const street = data.street?.trim();
    const city = data.city?.trim();
    const province = data.province?.trim();
    const zipCode = data.zipCode?.trim();
    
    // Check if at least one address field has a value
    if (street || city || province || zipCode) {
      formData.address = {
        street: street || null,
        city: city || null,
        province: province || null,
        zipCode: zipCode || null
      };
    }

    if (event.isEditMode && event.editingId) {
      // UPDATE operation
      this.supplierService.updateSupplier(Number(event.editingId), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (supplier) => {
            this.supplierFormService.notifySupplierUpdated(supplier);
            this.resetForm();
            this.onClose();
            this.supplierFormService.viewSupplierDetails(supplier);
          },
          error: (error) => {
            console.error('Error updating supplier:', error);
            alert(`Error al actualizar el proveedor: ${error.error?.message || error.message || 'Error desconocido'}`);
          }
        });
    } else {
      // CREATE operation
      console.log('Sending supplier data to backend:', formData); // Debug log
      this.supplierService.createSupplier(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (supplier) => {
            this.supplierFormService.notifySupplierCreated(supplier);
            this.resetForm();
            this.onClose();
            this.supplierFormService.viewSupplierDetails(supplier);
          },
          error: (error) => {
            console.error('Error creating supplier:', error);
            alert(`Error al crear el proveedor: ${error.error?.message || error.message || 'Error desconocido'}`);
          }
        });
    }
  }

  // ==================== Load Supplier for Edit ====================
  
  loadSupplier(supplier: Supplier): void {
    this.isEditMode = true;
    this.editingSupplierId = supplier.id;

    // Prepare data for form - flatten address fields to root level
    const supplierData: any = {
      tradeName: supplier.tradeName,
      legalName: supplier.legalName || '',
      cuit: supplier.cuit || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      street: supplier.address?.street || '',
      city: supplier.address?.city || '',
      province: supplier.address?.province || '',
      zipCode: supplier.address?.zipCode || ''
    };

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(supplierData);
    }

    this.cdr.detectChanges();
  }

  // ==================== Reset Form ====================
  
  resetForm(): void {
    this.isEditMode = false;
    this.editingSupplierId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  // ==================== Form Actions ====================
  
  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}
