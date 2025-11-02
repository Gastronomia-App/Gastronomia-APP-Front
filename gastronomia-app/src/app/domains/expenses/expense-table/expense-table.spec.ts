import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseTable } from './expense-table';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ExpenseTable', () => {
  let component: ExpenseTable;
  let fixture: ComponentFixture<ExpenseTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseTable],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
