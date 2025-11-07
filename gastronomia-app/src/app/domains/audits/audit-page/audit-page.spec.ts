import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditsPage } from './audit-page';

describe('AuditsPage', () => {
  let component: AuditsPage;
  let fixture: ComponentFixture<AuditsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
