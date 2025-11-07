import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BusinessForm } from './business-form';

describe('BusinessForm', () => {
  let component: BusinessForm;
  let fixture: ComponentFixture<BusinessForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have form configuration', () => {
    expect(component.formConfig).toBeDefined();
    expect(component.formConfig.sections).toBeDefined();
    expect(component.formConfig.sections.length).toBeGreaterThan(0);
  });

  it('should start in create mode', () => {
    expect(component.isEditMode).toBe(false);
    expect(component.editingBusinessId).toBeNull();
  });

  it('should emit onFormClosed on close', () => {
    spyOn(component.onFormClosed, 'emit');
    component.onClose();
    expect(component.onFormClosed.emit).toHaveBeenCalled();
  });

  it('should reset edit mode on cancel', () => {
    component.isEditMode = true;
    component.editingBusinessId = 123;
    
    component.onFormCancel();
    
    expect(component.isEditMode).toBe(false);
    expect(component.editingBusinessId).toBeNull();
  });
});
