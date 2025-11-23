import { Component, input } from '@angular/core';
import { Business } from '../../../shared/models';

@Component({
  selector: 'app-business-info',
  imports: [],
  templateUrl: './business-info.html',
  styleUrl: './business-info.css',
})
export class BusinessInfo {
readonly business = input<Business | null>(null);
}
