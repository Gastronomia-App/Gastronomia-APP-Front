import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../services';
import { Business } from '../../../shared/models';
import { Confirm } from '../../../shared/components/confirm';
import { BusinessForm } from '../business-form/business-form';

@Component({
  selector: 'app-business-page',
  imports: [CommonModule, FormsModule, BusinessForm, Confirm],
  templateUrl: './business-page.html',
  styleUrl: './business-page.css',
})
export class BusinessPage implements OnInit {
  private businessService = inject(BusinessService);
  
  // UI state
  myBusiness = signal<Business | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  isEditMode = signal(false);
  
  // Confirm dialogs
  showDeleteConfirm = signal(false);
  showSaveConfirm = signal(false);
  pendingFormData: any = null;

  // Delete confirmation
  deleteConfirmText = '';
  isDeleteConfirmed = signal(false);

  ngOnInit(): void {
    this.loadMyBusiness();
  }

  // ==================== Data Loading ====================

  loadMyBusiness(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.businessService.getMyBusiness().subscribe({
      next: (business) => {
        this.myBusiness.set(business);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading business:', error);
        this.isLoading.set(false);
        
        if (error.status === 404) {
          this.errorMessage.set('No tienes un negocio asociado');
        } else if (error.status === 401) {
          this.errorMessage.set('No estás autenticado');
        } else {
          this.errorMessage.set('Error al cargar el negocio');
        }
      }
    });
  }

  // ==================== Actions ====================

  onEditClick(): void {
    this.isEditMode.set(true);
  }

  onCancelEdit(): void {
    this.isEditMode.set(false);
    this.pendingFormData = null;
  }

  onFormSubmit(event: any): void {
    this.pendingFormData = event.data;
    this.showSaveConfirm.set(true);
  }

  onConfirmSave(): void {
    if (!this.myBusiness() || !this.pendingFormData) return;

    const businessId = this.myBusiness()!.id!;
    
    this.businessService.updateBusiness(businessId, this.pendingFormData).subscribe({
      next: (updated) => {
        this.myBusiness.set(updated);
        this.isEditMode.set(false);
        this.showSaveConfirm.set(false);
        this.pendingFormData = null;
        alert('Negocio actualizado correctamente');
      },
      error: (error) => {
        console.error('Error updating business:', error);
        this.showSaveConfirm.set(false);
        
        if (error.status === 403) {
          alert('No tienes permiso para modificar este negocio');
        } else {
          alert('Error al actualizar el negocio');
        }
      }
    });
  }

  onCancelSave(): void {
    this.showSaveConfirm.set(false);
    this.pendingFormData = null;
  }

  onDeleteClick(): void {
    this.deleteConfirmText = '';
    this.isDeleteConfirmed.set(false);
    this.showDeleteConfirm.set(true);
  }

  onDeleteInputChange(): void {
    this.isDeleteConfirmed.set(this.deleteConfirmText.toLowerCase() === 'eliminar');
  }

  onConfirmDelete(): void {
    if (!this.myBusiness() || !this.isDeleteConfirmed()) return;

    const businessId = this.myBusiness()!.id!;
    
    this.businessService.deleteBusiness(businessId).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        alert('Negocio eliminado correctamente');
        // Redirect or reload
        window.location.href = '/';
      },
      error: (error) => {
        console.error('Error deleting business:', error);
        this.showDeleteConfirm.set(false);
        
        if (error.status === 403) {
          alert('No tienes permiso para eliminar este negocio');
        } else {
          alert('Error al eliminar el negocio');
        }
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteConfirmText = '';
    this.isDeleteConfirmed.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    // Solo cerrar si se hace click directamente en el backdrop
    if (event.target === event.currentTarget) {
      this.onCancelDelete();
    }
  }
}
