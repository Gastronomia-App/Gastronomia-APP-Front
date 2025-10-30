import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEmployeePageComponent } from './create-employee';

describe('CreateEmployeePageComponent', () => {
  let component: CreateEmployeePageComponent;
  let fixture: ComponentFixture<CreateEmployeePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEmployeePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEmployeePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
