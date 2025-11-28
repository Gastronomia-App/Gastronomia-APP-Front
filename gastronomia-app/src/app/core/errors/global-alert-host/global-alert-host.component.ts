// core/errors/global-alert-host.component.ts
import { Component } from '@angular/core';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AlertStoreService } from '../alert-store.service';

@Component({
  selector: 'app-global-alert-host',
  standalone: true,
  imports: [AlertComponent],
  templateUrl: './global-alert-host.component.html',
  styleUrl: './global-alert-host.component.css'
})
export class GlobalAlertHostComponent {

  // Lo exponemos como protected/public para usarlo en el template
  constructor(protected readonly alertStore: AlertStoreService) {}

  handleClose(): void {
    this.alertStore.hide();
  }
}