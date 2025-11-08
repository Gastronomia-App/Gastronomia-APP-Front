import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditTable } from './audit-table';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuditTable', () => {
  let component: AuditTable;
  let fixture: ComponentFixture<AuditTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditTable],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
