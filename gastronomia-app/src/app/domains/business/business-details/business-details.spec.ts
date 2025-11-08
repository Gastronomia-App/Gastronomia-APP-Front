import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessDetails } from './business-details';

describe('BusinessDetails', () => {
  let component: BusinessDetails;
  let fixture: ComponentFixture<BusinessDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
