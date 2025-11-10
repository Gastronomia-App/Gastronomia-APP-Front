import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingGridView } from './seating-grid-view';

describe('SeatingGridView', () => {
  let component: SeatingGridView;
  let fixture: ComponentFixture<SeatingGridView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingGridView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingGridView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
