import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Audit } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuditFormService {
  // Observables for component communication
  private editAuditSource = new Subject<Audit>();
  private viewAuditDetailsSource = new Subject<Audit>();
  private closeDetailsSource = new Subject<void>();
  private auditCreatedSource = new Subject<Audit>();
  private auditUpdatedSource = new Subject<Audit>();
  private auditFinalizedSource = new Subject<Audit>();
  private activeAuditIdSource = new Subject<number | null>();

  // Public observables
  editAudit$ = this.editAuditSource.asObservable();
  viewAuditDetails$ = this.viewAuditDetailsSource.asObservable();
  closeDetails$ = this.closeDetailsSource.asObservable();
  auditCreated$ = this.auditCreatedSource.asObservable();
  auditUpdated$ = this.auditUpdatedSource.asObservable();
  auditFinalized$ = this.auditFinalizedSource.asObservable();
  activeAuditId$ = this.activeAuditIdSource.asObservable();

  // Methods to trigger events
  editAudit(audit: Audit): void {
    this.setActiveAuditId(audit.id);
    this.editAuditSource.next(audit);
  }

  viewAuditDetails(audit: Audit): void {
    this.setActiveAuditId(audit.id);
    this.viewAuditDetailsSource.next(audit);
  }

  openEditForm(audit: Audit): void {
    this.editAudit(audit);
  }

  closeDetails(): void {
    this.setActiveAuditId(null);
    this.closeDetailsSource.next();
  }

  notifyAuditCreated(audit: Audit): void {
    this.auditCreatedSource.next(audit);
  }

  notifyAuditUpdated(audit: Audit): void {
    this.auditUpdatedSource.next(audit);
  }

  notifyAuditFinalized(audit: Audit): void {
    this.auditFinalizedSource.next(audit);
  }

  setActiveAuditId(id: number | null): void {
    this.activeAuditIdSource.next(id);
  }
}
