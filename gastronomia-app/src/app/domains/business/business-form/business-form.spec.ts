import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessForm } from './business-form';

describe('BusinessForm', () => {
  let component: BusinessForm;
  let fixture: ComponentFixture<BusinessForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
