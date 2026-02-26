import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export type DataEntityType = 'PRODUCT' | 'CATEGORY' | 'ORDER' | 'SEATING';

/**
 * Simple event bus for real-time data synchronization.
 * NotificationService feeds events here; components subscribe to refresh their data.
 */
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly changesSubject = new Subject<DataEntityType>();

  emit(type: DataEntityType): void {
    this.changesSubject.next(type);
  }

  on(...types: DataEntityType[]): Observable<DataEntityType> {
    return this.changesSubject.pipe(filter(t => types.includes(t)));
  }
}
