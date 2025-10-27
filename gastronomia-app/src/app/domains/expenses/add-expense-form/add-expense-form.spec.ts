import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddExpenseForm } from './add-expense-form';

describe('AddExpenseForm', () => {
  let component: AddExpenseForm;
  let fixture: ComponentFixture<AddExpenseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExpenseForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExpenseForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
