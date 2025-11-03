import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesDetail } from './employees-detail';

describe('EmployeesDetail', () => {
  let component: EmployeesDetail;
  let fixture: ComponentFixture<EmployeesDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
