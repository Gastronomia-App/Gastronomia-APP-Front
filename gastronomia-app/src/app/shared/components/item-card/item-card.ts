import { Component, input, output, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interfaz base para items que pueden ser usados en ItemCard
 * Requiere solo id y name
 */
export interface BaseCardItem {
  id?: number;
  name?: string;
}

/**
 * Configuración de campo personalizado para mostrar en el card
 */
export interface CardField {
  key: string;           // Nombre de la propiedad en el objeto
  label?: string;        // Etiqueta a mostrar (opcional)
  type: 'text' | 'number' | 'currency' | 'badge-list';
  editable?: boolean;    // Si el campo es editable
  suffix?: string;       // Sufijo a mostrar (ej: '$', 'kg')
  prefix?: string;       // Prefijo a mostrar
  formatter?: (value: any) => string;  // Función personalizada para formatear el valor
  visible?: boolean | ((item: any) => boolean);  // Control de visibilidad
}

/**
 * Configuración de opciones para el badge-list
 */
export interface BadgeListConfig {
  itemsKey: string;              // Key del array de items
  nameKey: string;               // Key para obtener el nombre del badge
  quantityKey?: string;          // Key para obtener la cantidad (opcional)
  showQuantity?: boolean;        // Si mostrar la cantidad
}

/**
 * ItemCard genérico y flexible - Compatible con cualquier tipo de dato
 * Puede mostrar Items, ProductOptions, Products, o cualquier objeto con id y name
 */
@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.css',
})
export class ItemCard<T extends BaseCardItem = any> {
  // Inputs
  item = input.required<T>();
  editable = input<boolean>(false);
  
  // Configuración de campos a mostrar
  nameField = input<string>('name');  // Campo a usar para el nombre principal
  displayFields = input<CardField[]>([]);  // Campos adicionales a mostrar (quantity, price, etc)
  
  // Configuración de badges (para selectedOptions, components, etc)
  badgeListConfig = input<BadgeListConfig | null>(null);
  
  // Configuración de comentario
  commentField = input<string>('comment');  // Campo donde está el comentario
  
  // Configuración de acciones
  deletable = input<boolean>(true);  // Show delete button

  // Outputs
  remove = output<number>();
  fieldUpdated = output<{ id: number; field: string; value: any }>();
  commentUpdated = output<{ id: number; comment: string }>();

  // State
  isEditingComment = signal(false);
  commentDraft = signal('');

  @ViewChild('commentInput') commentInput?: ElementRef<HTMLInputElement>;

  // Computed: Item name
  itemName = computed(() => {
    const itemData = this.item();
    const nameKey = this.nameField();
    return (itemData as any)[nameKey] || 'Unknown Item';
  });

  // Computed: Has badges to display
  hasBadges = computed(() => {
    const config = this.badgeListConfig();
    if (!config) return false;
    
    const itemData = this.item();
    const items = (itemData as any)[config.itemsKey];
    return items && Array.isArray(items) && items.length > 0;
  });

  // Computed: Badge items
  badgeItems = computed(() => {
    const config = this.badgeListConfig();
    if (!config) return [];
    
    const itemData = this.item();
    return (itemData as any)[config.itemsKey] || [];
  });

  // Computed: Has comment
  hasComment = computed(() => {
    const commentKey = this.commentField();
    const comment = (this.item() as any)[commentKey];
    return comment !== undefined && comment !== null && comment.trim().length > 0;
  });

  // Computed: Comment text
  commentText = computed(() => {
    const commentKey = this.commentField();
    return (this.item() as any)[commentKey] || '';
  });

  // Computed: Visible fields
  visibleFields = computed(() => {
    return this.displayFields().filter(field => {
      if (field.visible === undefined) return true;
      if (typeof field.visible === 'boolean') return field.visible;
      return field.visible(this.item());
    });
  });

  /**
   * Get field value from item
   */
  getFieldValue(field: CardField): any {
    const itemData = this.item() as any;
    return itemData[field.key];
  }

  /**
   * Set field value in item
   */
  setFieldValue(field: CardField, value: any): void {
    const parsedValue = field.type === 'number' || field.type === 'currency' 
      ? Number(value) 
      : value;
  
    this.fieldUpdated.emit({ 
      id: this.item().id!, 
      field: field.key, 
      value: parsedValue 
    });
  }

  /**
   * Format field value for display
   */
  formatFieldValue(field: CardField, value: any): string {
    if (field.formatter) {
      return field.formatter(value);
    }

    if (field.type === 'currency') {
      return `${field.prefix || ''}${Number(value).toFixed(2)}${field.suffix || ''}`;
    }

    if (field.type === 'number') {
      return `${field.prefix || ''}${value}${field.suffix || ''}`;
    }

    return String(value);
  }

  /**
   * Get badge name
   */
  getBadgeName(badge: any): string {
    const config = this.badgeListConfig();
    if (!config) return '';
    
    // Support nested properties (e.g., 'productOption.productName')
    const keys = config.nameKey.split('.');
    let value = badge;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || '';
  }

  /**
   * Get badge quantity
   */
  getBadgeQuantity(badge: any): number | null {
    const config = this.badgeListConfig();
    if (!config || !config.quantityKey || !config.showQuantity) return null;
    
    return badge[config.quantityKey] || null;
  }

  /**
   * PUBLIC API: Enable comment edit mode
   * Call this method from parent component via template reference
   * Example: <app-item-card #card> <button (click)="card.enableCommentEditMode()"></button>
   */
  enableCommentEditMode(): void {
    const commentKey = this.commentField();
    this.commentDraft.set((this.item() as any)[commentKey] || '');
    this.isEditingComment.set(true);
    
    setTimeout(() => {
      this.commentInput?.nativeElement.focus();
    }, 0);
  }

  /**
   * Save comment changes
   */
  saveComment(): void {
    const comment = this.commentDraft().trim();
    this.commentUpdated.emit({ id: this.item().id!, comment });
    this.isEditingComment.set(false);
  }

  /**
   * Cancel comment editing
   */
  cancelCommentEdit(): void {
    this.commentDraft.set('');
    this.isEditingComment.set(false);
  }

  /**
   * Handle comment input keydown
   */
  onCommentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveComment();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelCommentEdit();
    }
  }

  /**
   * Handle comment input blur (save on blur)
   */
  onCommentBlur(): void {
    this.saveComment();
  }

  /**
   * Handle remove button click
   */
  onRemove(): void {
    if (this.item().id !== undefined) {
      this.remove.emit(this.item().id!);
    }
  }
}

