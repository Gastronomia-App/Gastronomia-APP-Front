import { Component, input } from '@angular/core';
import { Business } from '../../../shared/models';
import { QrMenuComponent } from '../../../shared/components/qr-menu/qr-menu.component';

@Component({
  selector: 'app-business-info',
  imports: [QrMenuComponent],
  templateUrl: './business-info.html',
  styleUrl: './business-info.css',
})
export class BusinessInfo {
readonly business = input<Business | null>(null);
}
