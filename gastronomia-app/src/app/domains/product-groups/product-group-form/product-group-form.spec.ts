import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupForm } from './product-group-form';

describe('ProductGroupForm', () => {
  let component: ProductGroupForm;
  let fixture: ComponentFixture<ProductGroupForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGroupForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGroupForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
