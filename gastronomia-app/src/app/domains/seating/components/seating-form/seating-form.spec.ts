import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatingForm } from './seating-form';

describe('SeatingForm', () => {
  let component: SeatingForm;
  let fixture: ComponentFixture<SeatingForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
