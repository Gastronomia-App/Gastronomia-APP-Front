import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderItemsForm } from './order-items-form';

describe('OrderItemsForm', () => {
  let component: OrderItemsForm;
  let fixture: ComponentFixture<OrderItemsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderItemsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderItemsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
