import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesList } from './list-employees';

describe('EmployeesList', () => {
  let component: EmployeesList;
  let fixture: ComponentFixture<EmployeesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
