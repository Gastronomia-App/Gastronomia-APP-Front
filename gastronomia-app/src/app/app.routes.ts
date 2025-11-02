import { Routes } from '@angular/router';
import { ProductPage } from './domains/products/product-page/product-page';
import { CategoryPage } from './domains/categories/category-page/category-page';
import { ProductGroupPage } from './domains/product-groups/product-group-page/product-group-page';

export const routes: Routes = [
  {
    path: 'products', component: ProductPage
  },
  {
    path: 'categories', component: CategoryPage
  },
  {
    path: 'groups', component: ProductGroupPage
  }
];
