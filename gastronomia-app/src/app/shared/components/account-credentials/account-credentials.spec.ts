import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCredentials } from './account-credentials';

describe('AccountCredentials', () => {
  let component: AccountCredentials;
  let fixture: ComponentFixture<AccountCredentials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCredentials]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountCredentials);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
