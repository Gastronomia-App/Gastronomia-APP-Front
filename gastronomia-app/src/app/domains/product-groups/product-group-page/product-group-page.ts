import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductGroupTable } from '../product-group-table/product-group-table';
import { ProductGroupForm } from '../product-group-form/product-group-form';
import { ProductGroupDetail } from '../product-group-detail/product-group-detail';
import { ProductGroupFormService } from '../services/product-group-form.service';
import { ProductGroup } from '../../../shared/models';

@Component({
  selector: 'app-product-group-page',
  imports: [ProductGroupForm, ProductGroupDetail, ProductGroupTable],
  templateUrl: './product-group-page.html',
  styleUrl: './product-group-page.css',
})
export class ProductGroupPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(ProductGroupTable) productGroupTable?: ProductGroupTable;
  @ViewChild(ProductGroupForm) productGroupFormComponent?: ProductGroupForm;
  @ViewChild(ProductGroupDetail) productGroupDetailComponent?: ProductGroupDetail;
  
  private productGroupFormService = inject(ProductGroupFormService);
  private subscriptions = new Subscription();
  private pendingProductGroup?: ProductGroup;
  private pendingDetailsProductGroup?: ProductGroup;
  
  // UI state
  showProductGroupForm = signal(false);
  showProductGroupDetails = signal(false);
  currentProductGroupId: number | null = null;

  ngOnInit(): void {
    // Subscribe to product group form service events
    this.subscriptions.add(
      this.productGroupFormService.editProductGroup$.subscribe((productGroup) => {
        this.showProductGroupDetails.set(false);
        this.currentProductGroupId = productGroup.id;
        this.pendingProductGroup = productGroup;
        this.showProductGroupForm.set(true);
      })
    );

    this.subscriptions.add(
      this.productGroupFormService.viewProductGroupDetails$.subscribe((productGroup) => {
        // Toggle details if same product group
        if (this.currentProductGroupId === productGroup.id && this.showProductGroupDetails()) {
          this.closeProductGroupDetails();
        } else {
          this.showProductGroupForm.set(false);
          this.currentProductGroupId = productGroup.id;
          this.productGroupFormService.setActiveProductGroupId(productGroup.id);
          this.pendingDetailsProductGroup = productGroup;
          this.showProductGroupDetails.set(true);
        }
      })
    );

    this.subscriptions.add(
      this.productGroupFormService.closeDetails$.subscribe(() => {
        this.showProductGroupDetails.set(false);
        this.showProductGroupForm.set(false);
        this.currentProductGroupId = null;
        this.productGroupFormService.setActiveProductGroupId(null);
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.pendingProductGroup && this.productGroupFormComponent) {
      this.productGroupFormComponent.loadProductGroup(this.pendingProductGroup);
      this.pendingProductGroup = undefined;
    }

    if (this.pendingDetailsProductGroup && this.productGroupDetailComponent) {
      this.productGroupDetailComponent.loadProductGroup(this.pendingDetailsProductGroup);
      this.pendingDetailsProductGroup = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== Form and Panel Management ====================

  openProductGroupForm(): void {
    this.showProductGroupDetails.set(false);
    this.showProductGroupForm.set(true);
    this.currentProductGroupId = null;
    this.productGroupFormService.setActiveProductGroupId(null);
    
    setTimeout(() => {
      if (this.productGroupFormComponent) {
        this.productGroupFormComponent.resetForm();
      }
    }, 0);
  }

  closeProductGroupForm(): void {
    this.showProductGroupForm.set(false);
    this.currentProductGroupId = null;
    this.productGroupFormService.setActiveProductGroupId(null);
  }

  closeProductGroupDetails(): void {
    this.showProductGroupDetails.set(false);
    this.currentProductGroupId = null;
    this.productGroupFormService.setActiveProductGroupId(null);
  }
}
