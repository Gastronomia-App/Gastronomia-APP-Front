import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupDetail } from './product-group-detail';

describe('ProductGroupDetail', () => {
  let component: ProductGroupDetail;
  let fixture: ComponentFixture<ProductGroupDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGroupDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGroupDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
