import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessInfo } from './business-info';

describe('BusinnesInfo', () => {
  let component: BusinessInfo;
  let fixture: ComponentFixture<BusinessInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
