import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm {
  fb = inject(FormBuilder)
  productForm = this.fb.group({

  })

  onSubmit(): void {

  }

  onCancel(): void {

  }

  onClose(): void {
    
  }
}
