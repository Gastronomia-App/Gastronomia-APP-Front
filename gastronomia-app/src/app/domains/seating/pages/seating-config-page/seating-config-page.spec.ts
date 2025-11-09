import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatingConfigPage } from './seating-config-page';

describe('SeatingConfigPage', () => {
  let component: SeatingConfigPage;
  let fixture: ComponentFixture<SeatingConfigPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingConfigPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingConfigPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
