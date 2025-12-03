import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-selectable-item-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selectable-item-card.html',
  styleUrl: './selectable-item-card.css'
})
export class SelectableItemCard {
  name = input.required<string>();
  quantity = input<number>();
  price = input<number>();
  isSelected = input<boolean>(false);
  hasChildren = input<boolean>(false);
  isExpanded = input<boolean>(false);
  indentLevel = input<number>(0);
  badges = input<string[]>([]);
  isInvalid = input<boolean>(false); // New: mark card as invalid (red)
  comment = input<string>(''); // Comment to display
  showCommentButton = input<boolean>(false); // Whether to show comment button

  clicked = output<void>();
  remove = output<void>();
  toggleExpand = output<void>();
  commentChanged = output<string>(); // Emit when comment changes

  // Local state for comment editing
  isEditingComment = signal(false);
  editingCommentValue = signal('');

  onCardClick(): void {
    if (!this.isEditingComment()) {
      this.clicked.emit();
    }
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.remove.emit();
  }

  onToggleExpand(event: Event): void {
    event.stopPropagation();
    this.toggleExpand.emit();
  }

  onCommentClick(event: Event): void {
    event.stopPropagation();
    this.editingCommentValue.set(this.comment() || '');
    this.isEditingComment.set(true);
    // Focus input after Angular renders it
    setTimeout(() => {
      const input = document.querySelector('.comment-edit-input') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  }

  onCommentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveComment();
    } else if (event.key === 'Escape') {
      this.cancelComment();
    }
  }

  saveComment(): void {
    const newComment = this.editingCommentValue().trim();
    this.commentChanged.emit(newComment);
    this.isEditingComment.set(false);
  }

  cancelComment(): void {
    this.isEditingComment.set(false);
    this.editingCommentValue.set('');
  }
}
