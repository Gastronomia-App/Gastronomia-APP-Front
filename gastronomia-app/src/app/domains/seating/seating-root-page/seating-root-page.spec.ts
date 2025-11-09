import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingRootPage } from './seating-root-page';

describe('SeatingRootPage', () => {
  let component: SeatingRootPage;
  let fixture: ComponentFixture<SeatingRootPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingRootPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingRootPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
