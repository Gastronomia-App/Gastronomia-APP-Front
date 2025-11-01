import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeForm } from './create-employee';

describe('EmployeeForm', () => {
  let component: EmployeeForm;
  let fixture: ComponentFixture<EmployeeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
