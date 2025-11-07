import { 
  Component, 
  inject, 
  ViewChild, 
  OnInit, 
  signal, 
  AfterViewChecked,
  DestroyRef,
  afterNextRender
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuditForm } from '../audit-form/audit-form';
import { AuditTable } from '../audit-table/audit-table';
import { AuditDetails } from '../audit-details/audit-details';
import { AuditFormService } from '../services';
import { Audit } from '../../../shared/models';

@Component({
  selector: 'app-audits-page',
  standalone: true,
  imports: [AuditForm, AuditTable, AuditDetails],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.css',
})
export class AuditsPage implements OnInit, AfterViewChecked {
  // ==================== ViewChild References ====================
  
  @ViewChild(AuditForm) auditFormComponent?: AuditForm;
  @ViewChild(AuditTable) auditTableComponent?: AuditTable;
  @ViewChild(AuditDetails) auditDetailsComponent?: AuditDetails;
  
  // ==================== Services ====================
  
  private auditFormService = inject(AuditFormService);
  private destroyRef = inject(DestroyRef);
  
  // ==================== Pending Operations (for AfterViewChecked) ====================
  
  private pendingAudit?: Audit;
  private pendingDetailsAudit?: Audit;
  
  // ==================== UI State - SIGNALS ====================
  
  showAuditForm = signal(false);
  showAuditDetails = signal(false);
  currentAuditId: number | null = null;

  // ==================== Lifecycle - OnInit ====================
  
  ngOnInit(): void {
    // Subscribe to audit form service events with automatic cleanup
    this.auditFormService.editAudit$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((audit) => {
        this.showAuditDetails.set(false);
        this.currentAuditId = audit.id;
        this.pendingAudit = audit;
        this.showAuditForm.set(true);
      });

    this.auditFormService.viewAuditDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((audit) => {
        // Toggle details if same audit
        if (this.currentAuditId === audit.id && this.showAuditDetails()) {
          this.closeAuditDetails();
        } else {
          this.showAuditForm.set(false);
          this.currentAuditId = audit.id;
          this.auditFormService.setActiveAuditId(audit.id);
          this.pendingDetailsAudit = audit;
          this.showAuditDetails.set(true);
        }
      });

    this.auditFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showAuditDetails.set(false);
        this.showAuditForm.set(false);
        this.currentAuditId = null;
        this.auditFormService.setActiveAuditId(null);
      });
  }

  // ==================== Lifecycle - AfterViewChecked ====================
  
  ngAfterViewChecked(): void {
    // Load pending audit into form after view is initialized
    if (this.pendingAudit && this.auditFormComponent) {
      this.auditFormComponent.loadAudit(this.pendingAudit);
      this.pendingAudit = undefined; // Clear pending
    }

    // Load pending audit into details after view is initialized
    if (this.pendingDetailsAudit && this.auditDetailsComponent) {
      this.auditDetailsComponent.loadAudit(this.pendingDetailsAudit);
      this.pendingDetailsAudit = undefined;
    }
  }

  // ==================== Form Management ====================

  openAuditForm(): void {
    this.showAuditDetails.set(false);
    this.showAuditForm.set(true);
    this.currentAuditId = null;
    this.auditFormService.setActiveAuditId(null);
    
    afterNextRender(() => {
      if (this.auditFormComponent) {
        this.auditFormComponent.resetForm();
      }
    });
  }

  closeAuditForm(): void {
    this.showAuditForm.set(false);
    this.currentAuditId = null;
    this.auditFormService.setActiveAuditId(null);
  }

  closeAuditDetails(): void {
    this.showAuditDetails.set(false);
    this.currentAuditId = null;
    this.auditFormService.setActiveAuditId(null);
  }
}
