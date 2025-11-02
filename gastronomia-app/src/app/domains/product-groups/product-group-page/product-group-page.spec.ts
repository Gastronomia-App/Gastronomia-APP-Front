import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupPage } from './product-group-page';

describe('ProductGroupPage', () => {
  let component: ProductGroupPage;
  let fixture: ComponentFixture<ProductGroupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGroupPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGroupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
