import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingStatusView } from './seating-status-view';

describe('TableGrid', () => {
  let component: SeatingStatusView;
  let fixture: ComponentFixture<SeatingStatusView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingStatusView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingStatusView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
