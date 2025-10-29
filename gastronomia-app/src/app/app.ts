import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomerPage } from './domains/customer/pages/customer-page/customer-page';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomerPage, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('gastronomia-app');
}
