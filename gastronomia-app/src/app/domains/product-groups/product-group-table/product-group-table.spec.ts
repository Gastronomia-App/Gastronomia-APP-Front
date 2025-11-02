import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupTable } from './product-group-table';

describe('ProductGroupTable', () => {
  let component: ProductGroupTable;
  let fixture: ComponentFixture<ProductGroupTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGroupTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGroupTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
