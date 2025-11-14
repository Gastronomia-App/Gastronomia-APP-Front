import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingStatusPage } from './seating-status-page';

describe('SeatingStatusPage', () => {
  let component: SeatingStatusPage;
  let fixture: ComponentFixture<SeatingStatusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingStatusPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
