import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { BusinessTable } from '../business-table/business-table';
import { BusinessForm } from '../business-form/business-form';
import { BusinessDetails } from '../business-details/business-details';
import { BusinessFormService } from '../services';
import { Business } from '../../../shared/models';

@Component({
  selector: 'app-business-page',
  imports: [BusinessForm, BusinessDetails, BusinessTable],
  templateUrl: './business-page.html',
  styleUrl: './business-page.css',
})
export class BusinessPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(BusinessTable) businessTable?: BusinessTable;
  @ViewChild(BusinessForm) businessFormComponent?: BusinessForm;
  @ViewChild(BusinessDetails) businessDetailsComponent?: BusinessDetails;
  
  private businessFormService = inject(BusinessFormService);
  private subscriptions = new Subscription();
  private pendingBusiness?: Business;
  private pendingDetailsBusiness?: Business;
  
  // UI state
  showBusinessForm = signal(false);
  showBusinessDetails = signal(false);
  currentBusinessId: number | null = null;

  ngOnInit(): void {
    // Subscribe to business form service events
    this.subscriptions.add(
      this.businessFormService.editBusiness$.subscribe((business) => {
        this.showBusinessDetails.set(false);
        this.currentBusinessId = business.id;
        this.pendingBusiness = business;
        this.showBusinessForm.set(true);
      })
    );

    this.subscriptions.add(
      this.businessFormService.viewBusinessDetails$.subscribe((business) => {
        // Toggle details if same business
        if (this.currentBusinessId === business.id && this.showBusinessDetails()) {
          this.closeBusinessDetails();
        } else {
          this.showBusinessForm.set(false);
          this.currentBusinessId = business.id;
          this.businessFormService.setActiveBusinessId(business.id);
          this.pendingDetailsBusiness = business;
          this.showBusinessDetails.set(true);
        }
      })
    );

    this.subscriptions.add(
      this.businessFormService.closeDetails$.subscribe(() => {
        this.showBusinessDetails.set(false);
        this.showBusinessForm.set(false);
        this.currentBusinessId = null;
        this.businessFormService.setActiveBusinessId(null);
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.pendingBusiness && this.businessFormComponent) {
      this.businessFormComponent.loadBusiness(this.pendingBusiness);
      this.pendingBusiness = undefined;
    }

    if (this.pendingDetailsBusiness && this.businessDetailsComponent) {
      this.businessDetailsComponent.loadBusiness(this.pendingDetailsBusiness);
      this.pendingDetailsBusiness = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== Form and Panel Management ====================

  openBusinessForm(): void {
    this.showBusinessDetails.set(false);
    this.showBusinessForm.set(true);
    this.currentBusinessId = null;
    this.businessFormService.setActiveBusinessId(null);
    
    setTimeout(() => {
      if (this.businessFormComponent) {
        this.businessFormComponent.resetForm();
      }
    }, 0);
  }

  closeBusinessForm(): void {
    this.showBusinessForm.set(false);
    this.currentBusinessId = null;
    this.businessFormService.setActiveBusinessId(null);
  }

  closeBusinessDetails(): void {
    this.showBusinessDetails.set(false);
    this.currentBusinessId = null;
    this.businessFormService.setActiveBusinessId(null);
  }
}
