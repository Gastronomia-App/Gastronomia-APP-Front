import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGrid } from './table-grid';

describe('TableGrid', () => {
  let component: TableGrid;
  let fixture: ComponentFixture<TableGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
