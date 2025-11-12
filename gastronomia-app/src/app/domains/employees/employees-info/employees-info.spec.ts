import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesInfo } from './employees-info';

describe('EmployeesInfo', () => {
  let component: EmployeesInfo;
  let fixture: ComponentFixture<EmployeesInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
