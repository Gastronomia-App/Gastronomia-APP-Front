import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableList } from './searchable-list';

describe('SearchableList', () => {
  let component: SearchableList;
  let fixture: ComponentFixture<SearchableList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchableList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
