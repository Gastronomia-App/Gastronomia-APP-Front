import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesUpdateProfile } from './employees-update-profile';

describe('EmployeesUpdateProfile', () => {
  let component: EmployeesUpdateProfile;
  let fixture: ComponentFixture<EmployeesUpdateProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesUpdateProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesUpdateProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
