import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeesUpdateProfile } from '../employees-update-profile/employees-update-profile';
import { EmployeesInfo } from '../employees-info/employees-info';

@Component({
  selector: 'app-employees-profile-page',
  standalone: true,
  imports: [CommonModule, EmployeesUpdateProfile, EmployeesInfo],
  templateUrl: './employees-profile-page.html',
  styleUrl: './employees-profile-page.css'
})
export class EmployeesProfilePage {
  /* Modal visibility */
  readonly showEditor = signal(false);
readonly refreshSignal = signal(0);

refreshInfo(): void {
  this.refreshSignal.update(v => v + 1);
}
  /* Actions */
  openEditor(): void { this.showEditor.set(true); }
  closeEditor(): void { this.showEditor.set(false); }
}