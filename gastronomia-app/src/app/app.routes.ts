import { Routes } from '@angular/router';
import { ProductPage } from './domains/products/product-page/product-page';
import { CategoryPage } from './domains/categories/category-page/category-page';

export const routes: Routes = [
  {
    path: 'products', component: ProductPage
  },
  {
    path: 'categories', component: CategoryPage
  }
];
