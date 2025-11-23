import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BusinessService } from '../services';
import { Business } from '../../../shared/models';
import { BusinessStateService } from '../services/business-state-service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { BusinessInfo } from '../business-info/business-info';
import { BusinessForm } from '../business-form/business-form';
import { BusinessDelete } from '../business-delete/business-delete';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-business-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent, BusinessInfo, BusinessForm, BusinessDelete],
  templateUrl: './business-page.html',
  styleUrl: './business-page.css'
})
export class BusinessPage implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly businessState = inject(BusinessStateService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  // Alert
  readonly showAlert = signal(false);
  readonly alertMessage = signal<string | null>(null);

  // UI state
  readonly myBusiness = signal<Business | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isEditMode = signal(false);

  // Delete confirmation
  readonly showDeleteConfirm = signal(false);

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
        this.businessState.set(business);
        this.isLoading.set(false);
      },
      error: (error) => {
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
    if (!this.myBusiness()) {
      return;
    }
    this.isEditMode.set(true);
  }

  onCancelEdit(): void {
    this.isEditMode.set(false);
  }

  onFormSubmit(dto: any): void {
    if (!this.myBusiness()) {
      return;
    }

    const businessId = this.myBusiness()!.id!;

    this.showAlert.set(false);

    this.businessService.updateBusiness(businessId, dto).subscribe({
      next: (updated) => {
        this.myBusiness.set(updated);
        this.businessState.set(updated);
        this.isEditMode.set(false);
      },
      error: (error) => {
        if (error.status === 403) {
          this.alertMessage.set('No tienes permiso para modificar este negocio.');
        } else {
          this.alertMessage.set('Error al actualizar el negocio.');
        }
        this.showAlert.set(true);
      }
    });
  }

  // ==================== Delete ====================

  onDeleteClick(): void {
    if (!this.myBusiness()) {
      return;
    }
    this.showDeleteConfirm.set(true);
  }

  onConfirmDelete(): void {
    if (!this.myBusiness()) {
      return;
    }

    const businessId = this.myBusiness()!.id!;

    this.businessService.deleteBusiness(businessId).subscribe({
      next: () => {
        // The child already shows the countdown overlay.
        // We just keep the modal abierto hasta que el hijo emita redirectAfterDelete.
      },
      error: (error) => {
        this.showDeleteConfirm.set(false);

        if (error.status === 403) {
          this.alertMessage.set('No tienes permiso para eliminar este negocio.');
        } else {
          this.alertMessage.set('Error al eliminar el negocio.');
        }

        this.showAlert.set(true);
      }
    });
  }

  onRedirectAfterDelete(): void {
    this.auth.logout();
    this.router.navigate(['']);
  }

  onCancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }
}
