import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersTable } from './customers-table';

describe('CustomersTable', () => {
  let component: CustomersTable;
  let fixture: ComponentFixture<CustomersTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomersTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
