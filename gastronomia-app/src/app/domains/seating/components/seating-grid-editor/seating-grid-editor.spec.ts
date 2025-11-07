import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatingGridEditor } from './seating-grid-editor';

describe('SeatingGridEditor', () => {
  let component: SeatingGridEditor;
  let fixture: ComponentFixture<SeatingGridEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatingGridEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatingGridEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
