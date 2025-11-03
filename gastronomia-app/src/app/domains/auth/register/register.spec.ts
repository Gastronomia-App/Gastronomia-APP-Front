import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on step 1', () => {
    expect(component.currentStep()).toBe(1);
  });

  it('should have two form groups', () => {
    expect(component.step1Form).toBeDefined();
    expect(component.step2Form).toBeDefined();
  });

  it('should not advance to step 2 with invalid step 1', () => {
    component.nextStep();
    expect(component.currentStep()).toBe(1);
    expect(component.errorMessage()).toBeTruthy();
  });

  it('should advance to step 2 with valid step 1', () => {
    component.step1Form.patchValue({
      businessName: 'Test Business',
      cuit: '20-12345678-9',
      street: 'Test Street 123',
      city: 'Test City',
      province: 'Test Province',
      zipCode: '1234',
      email: 'test@example.com',
      password: 'Test1234'
    });
    
    component.nextStep();
    expect(component.currentStep()).toBe(2);
    expect(component.errorMessage()).toBeNull();
  });

  it('should go back to step 1 from step 2', () => {
    component.currentStep.set(2);
    component.previousStep();
    expect(component.currentStep()).toBe(1);
  });
});
