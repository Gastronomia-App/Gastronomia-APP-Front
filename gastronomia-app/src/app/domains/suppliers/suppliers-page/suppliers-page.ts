import { 
  Component, 
  inject, 
  ViewChild, 
  OnInit, 
  signal, 
  AfterViewChecked,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupplierForm } from '../supplier-form/supplier-form';
import { SupplierTable } from '../supplier-table/supplier-table';
import { SupplierDetails } from '../supplier-details/supplier-details';
import { SupplierFormService } from '../services';
import { Supplier } from '../../../shared/models';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [SupplierForm, SupplierTable, SupplierDetails],
  templateUrl: './suppliers-page.html',
  styleUrl: './suppliers-page.css',
})
export class SuppliersPage implements OnInit, AfterViewChecked {
  // ==================== ViewChild References ====================
  
  @ViewChild(SupplierForm) supplierFormComponent?: SupplierForm;
  @ViewChild(SupplierTable) supplierTableComponent?: SupplierTable;
  @ViewChild(SupplierDetails) supplierDetailsComponent?: SupplierDetails;
  
  // ==================== Services ====================
  
  private supplierFormService = inject(SupplierFormService);
  private destroyRef = inject(DestroyRef);
  
  // ==================== Pending Operations ====================
  
  private pendingSupplier?: Supplier;
  private pendingDetailsSupplier?: Supplier;
  
  // ==================== UI State - SIGNALS ====================
  
  showSupplierForm = signal(false);
  showSupplierDetails = signal(false);
  currentSupplierId: number | null = null;

  // ==================== Lifecycle - OnInit ====================
  
  ngOnInit(): void {
    // Subscribe to edit supplier events
    this.supplierFormService.editSupplier$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((supplier) => {
        this.showSupplierDetails.set(false);
        this.currentSupplierId = supplier.id;
        this.pendingSupplier = supplier;
        this.showSupplierForm.set(true);
      });

    // Subscribe to view supplier details events
    this.supplierFormService.viewSupplierDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((supplier) => {
        // Toggle details if same supplier
        if (this.currentSupplierId === supplier.id && this.showSupplierDetails()) {
          this.closeSupplierDetails();
        } else {
          this.showSupplierForm.set(false);
          this.currentSupplierId = supplier.id;
          this.supplierFormService.setActivesupplierId(supplier.id);
          this.pendingDetailsSupplier = supplier;
          this.showSupplierDetails.set(true);
        }
      });

    // Subscribe to close details events
    this.supplierFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showSupplierDetails.set(false);
        this.showSupplierForm.set(false);
        this.currentSupplierId = null;
        this.supplierFormService.setActivesupplierId(null);
      });
  }

  // ==================== Lifecycle - AfterViewChecked ====================
  
  ngAfterViewChecked(): void {
    // Load pending supplier into form after view is initialized
    if (this.pendingSupplier && this.supplierFormComponent) {
      this.supplierFormComponent.loadSupplier(this.pendingSupplier);
      this.pendingSupplier = undefined; // Clear pending
    }

    // Load pending supplier into details after view is initialized
    if (this.pendingDetailsSupplier && this.supplierDetailsComponent) {
      this.supplierDetailsComponent.loadSupplier(this.pendingDetailsSupplier);
      this.pendingDetailsSupplier = undefined;
    }
  }

  // ==================== Public Methods ====================
  
  openCreateSupplierForm(): void {
    this.showSupplierDetails.set(false);
    this.showSupplierForm.set(true);
    this.currentSupplierId = null;
  }

  editSupplier(supplier: Supplier): void {
    this.showSupplierDetails.set(false);
    this.currentSupplierId = supplier.id;
    this.pendingSupplier = supplier;
    this.showSupplierForm.set(true);
  }

  closeSupplierForm(): void {
    this.showSupplierForm.set(false);
    this.currentSupplierId = null;
    if (this.supplierFormComponent) {
      this.supplierFormComponent.resetForm();
    }
  }

  closeSupplierDetails(): void {
    this.showSupplierDetails.set(false);
    this.currentSupplierId = null;
  }
}
