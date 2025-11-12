import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableEntity } from './searchable-entity';

describe('SearchableEntity', () => {
  let component: SearchableEntity;
  let fixture: ComponentFixture<SearchableEntity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableEntity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchableEntity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
