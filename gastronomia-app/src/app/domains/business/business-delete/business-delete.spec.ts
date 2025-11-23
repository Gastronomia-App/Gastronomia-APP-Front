import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessDelete } from './business-delete';

describe('BusinessDelete', () => {
  let component: BusinessDelete;
  let fixture: ComponentFixture<BusinessDelete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDelete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDelete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
