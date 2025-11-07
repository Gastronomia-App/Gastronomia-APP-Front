import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  route: string; // Route for routerLink (now required)
}

export interface SubHeaderAction {
  icon?: string;
  label?: string;
  class?: string;
  action: string;
  // Internal use: sanitized icon HTML
  iconSafe?: SafeHtml;
  // Optional icon controls for generic use
  iconSize?: number;      // overrides both width/height
  iconWidth?: number;     // px
  iconHeight?: number;    // px
  iconColor?: string;     // CSS color or 'currentColor'
}

@Component({
  selector: 'app-sub-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sub-header.html',
  styleUrl: './sub-header.css',
})
export class SubHeader {
  private readonly sanitizer = inject(DomSanitizer);
  // Inputs
  tabs = input<Tab[]>([]);
  actions = input<SubHeaderAction[]>([]);
  showLeftActions = input<boolean>(true);
  showRightActions = input<boolean>(true);

  // Outputs
  tabClick = output<string>();
  actionClick = output<string>();

  // Sanitize icons to allow safe inline SVG rendering
  readonly safeActions = computed<SubHeaderAction[]>(() =>
    (this.actions() || []).map(a => ({
      ...a,
      iconSafe: a.icon ? this.sanitizer.bypassSecurityTrustHtml(this.ensureSvgSized(a)) : undefined,
    }))
  );

  // Ensure inline SVGs have explicit size to render regardless of scoped styles
  private ensureSvgSized(action: SubHeaderAction): string {
    // Start with the source HTML outside try/catch to avoid scoping issues
    const source = action.icon ?? '';
    try {
      // Only process if it contains an <svg ...> tag
      if (!/<svg[\s>]/i.test(source)) return source;

      let updated = source;
      const width = (action.iconSize ?? action.iconWidth) ?? 20;
      const height = (action.iconSize ?? action.iconHeight) ?? 20;
      const color = action.iconColor ?? 'currentColor';
      // Add width if missing
      updated = updated.replace(/<svg(?![^>]*\bwidth=)([^>]*)>/i, `<svg$1 width="${width}" height="${height}">`);
      // Add height if width existed but height missing
      updated = updated.replace(/<svg([^>]*\bwidth=["'][^"']+["'][^>]*)((?!\bheight=)[^>]*)>/i, `<svg$1 height="${height}"$2>`);
      // Ensure fill uses provided color if not present
      updated = updated.replace(/<svg((?:(?!fill=).)*?)>/i, `<svg$1 fill="${color}">`);
      return updated;
    } catch {
      return source;
    }
  }

  onTabClick(tabId: string): void {
    this.tabClick.emit(tabId);
  }

  onActionClick(action: string): void {
    this.actionClick.emit(action);
  }
}
