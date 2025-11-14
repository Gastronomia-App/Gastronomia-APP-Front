import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingViewPage } from './seating-view-page';

describe('SeatingViewPage', () => {
  let component: SeatingViewPage;
  let fixture: ComponentFixture<SeatingViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingViewPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
