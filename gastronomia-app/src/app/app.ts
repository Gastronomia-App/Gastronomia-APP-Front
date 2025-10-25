import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/components/header/header";
import { Footer } from "./shared/components/footer/footer";
import { ProductForm } from "./domains/products/product-form/product-form";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ProductForm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('gastronomia-app');
}
