import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessTable } from './business-table';

describe('BusinessTable', () => {
  let component: BusinessTable;
  let fixture: ComponentFixture<BusinessTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
