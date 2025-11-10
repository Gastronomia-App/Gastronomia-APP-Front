import { TestBed } from '@angular/core/testing';
import { SeatingsService } from './seating-service';

describe('SeatingsService', () => {
  let service: SeatingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeatingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
