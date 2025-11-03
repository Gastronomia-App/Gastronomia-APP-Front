import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGridEditor } from './table-grid-editor';

describe('TableGridEditor', () => {
  let component: TableGridEditor;
  let fixture: ComponentFixture<TableGridEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGridEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableGridEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
