// app.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/components/header/header";
import { GlobalAlertHostComponent } from './core/errors/global-alert-host/global-alert-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, GlobalAlertHostComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('gastronomia-app');
}
