import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnInit,
  signal,
  computed,
  DestroyRef,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  MapPinIcon,
  PhoneIcon,
  Clock3Icon,
  InstagramIcon,
  FacebookIcon
} from 'lucide-angular';
import { fromEvent } from 'rxjs';

import { ScrollProgressBarComponent } from '../../shared/components/scroll-progress-bar/scroll-progress-bar.component';
import { PublicMenuService } from './services/public-menu.service';
import { Category, Product } from '../../shared/models';
import { environment } from '../../../enviroments/environment';
import { CATEGORY_ICON_MAP } from '../../shared/components/category-component/category-icon-selector/category-icon-map';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal-directive';
import { PublicBusiness } from '../../shared/models/public-business.model';

interface MenuCategory {
  id: number;
  name: string;
  icon?: string | null;
  color?: string;
  colorHue?: number;
}

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    CommonModule,
    ScrollProgressBarComponent,
    LucideAngularModule,
    ScrollRevealDirective
  ],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPageComponent implements OnInit {
  // Element that actually scrolls (the host with overflow-y: auto)
  readonly scrollHost: HTMLElement;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly menuService: PublicMenuService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute
  ) {
    // Here host is already available, so this is safe
    this.scrollHost = this.host.nativeElement;
  }

  // Public business info for footer and hero
  readonly business = signal<PublicBusiness | null>(null);

  // Lucide icons for footer
  readonly MapPinIcon = MapPinIcon;
  readonly PhoneIcon = PhoneIcon;
  readonly Clock3Icon = Clock3Icon;
  readonly InstagramIcon = InstagramIcon;
  readonly FacebookIcon = FacebookIcon;

  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly imageBaseUrl = this.apiBaseUrl.replace(/\/api\/?$/, '');

  protected readonly categoriesSectionRef =
    viewChild<ElementRef<HTMLElement>>('categoriesSection');

  readonly heroImages: string[] = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80'
  ];

  readonly loadingSkeletons = [1, 2, 3, 4, 5, 6];

  readonly menuCategories = signal<Category[]>([]);
  readonly categories = signal<MenuCategory[]>([]);

  readonly activeCategoryId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly currentHeroIndex = signal<number>(0);
  readonly heroProgress = signal<number>(0);
  readonly isHeroFading = signal<boolean>(false);

  // Scroll-driven animation for hero and categories bar
  readonly heroScrollY = signal<number>(0);

  // Basic responsive flag (mobile breakpoint)
  readonly isMobile = signal<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );

  // Slug title (set in ngOnInit)
  private slugTitle: string | null = null;

  // Hero content moves slightly with scroll (parallax-like)
  readonly heroContentTranslateY = computed(() => {
    const y = this.heroScrollY();
    const offset = Math.min(y * 0.25, 80);
    return offset;
  });

  // Hero content fades out while user scrolls down
  readonly heroContentOpacity = computed(() => {
    const y = this.heroScrollY();
    const opacity = 1 - y / 260;
    return opacity < 0 ? 0 : opacity;
  });

  // Corners follow the same opacity curve, slightly reduced
  readonly heroCornersOpacity = computed(() => {
    return this.heroContentOpacity() * 0.9;
  });

  // When user scrolls a bit, categories bar becomes compact
  readonly isNavCompact = computed(() => this.heroScrollY() > 120);

  private heroIntervalId: any;
  private readonly HERO_DURATION_MS = 7000;
  private readonly HERO_TICK_MS = 100;

  // Visible window sizes for categories
  private readonly DESKTOP_VISIBLE_CATEGORIES = 6;
  private readonly MOBILE_VISIBLE_CATEGORIES = 2;
  readonly categoryStartIndex = signal<number>(0);

  // Visible categories list (carousel)
  readonly visibleCategories = computed(() => {
    const all = this.categories();
    const total = all.length;

    if (total === 0) {
      return [];
    }

    const windowSize = this.isMobile()
      ? this.MOBILE_VISIBLE_CATEGORIES
      : this.DESKTOP_VISIBLE_CATEGORIES;

    const start = this.categoryStartIndex();
    const maxStart = Math.max(0, total - windowSize);
    const safeStart = Math.min(start, maxStart);
    const end = Math.min(safeStart + windowSize, total);

    return all.slice(safeStart, end);
  });

  readonly canScrollCategoriesLeft = computed(() => {
    return this.categoryStartIndex() > 0;
  });

  readonly canScrollCategoriesRight = computed(() => {
    const total = this.categories().length;
    if (total === 0) {
      return false;
    }

    const windowSize = this.isMobile()
      ? this.MOBILE_VISIBLE_CATEGORIES
      : this.DESKTOP_VISIBLE_CATEGORIES;

    if (total <= windowSize) {
      return false;
    }

    return this.categoryStartIndex() + windowSize < total;
  });

  readonly categoryIconComponentMap: Record<string, any> = CATEGORY_ICON_MAP;

  readonly heroTitle = computed(() => {
    const b = this.business();
    if (b?.name) {
      return b.name;
    }
    if (this.slugTitle) {
      return this.slugTitle;
    }
    return 'Menú';
  });

  readonly activeCategoryLabel = computed(() => {
    const id = this.activeCategoryId();
    const cats = this.categories();

    if (id == null || cats.length === 0) {
      return 'Menú';
    }

    const category = cats.find(c => c.id === id);
    return category?.name ?? 'Menú';
  });

  readonly activeCategoryIconComponent = computed(() => {
    const id = this.activeCategoryId();
    const cats = this.categories();

    if (id == null || cats.length === 0) {
      return null;
    }

    const category = cats.find(c => c.id === id);
    const iconKey = category?.icon;
    if (!iconKey) {
      return null;
    }

    return this.categoryIconComponentMap[iconKey] ?? null;
  });

  readonly filteredProducts = computed(() => {
    const activeId = this.activeCategoryId();
    const allCats = this.menuCategories();

    if (allCats.length === 0) {
      return [] as Product[];
    }

    if (activeId == null) {
      return allCats.flatMap(c => c.products ?? []);
    }

    const selected = allCats.find(c => c.id === activeId);
    return selected?.products ?? [];
  });

  readonly currentYear = new Date().getFullYear();

  // Address lines from public DTO
  readonly addressLine1 = computed(() => {
    return this.business()?.addressStreet ?? null;
  });

  readonly addressLine2 = computed(() => {
    const b = this.business();
    if (!b) {
      return null;
    }

    const parts: string[] = [];
    if (b.addressCity) {
      parts.push(b.addressCity);
    }
    if (b.addressZipCode) {
      parts.push(b.addressZipCode);
    }

    return parts.length ? parts.join(' - ') : null;
  });

  readonly addressLine3 = computed(() => {
    return this.business()?.addressProvince ?? null;
  });

  readonly businessPhoneLine = computed(() => {
    const phone = this.business()?.phoneNumber?.trim();
    return phone && phone.length > 0 ? phone : null;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.slugTitle = this.buildTitleFromSlug(slug);

    if (slug) {
      this.loadMenu(slug);
      this.loadBusiness(slug);
    } else {
      this.isLoading.set(false);
    }

    this.startHeroRotation();
    this.setupHeroScrollAnimation();
    this.setupResponsiveListeners();
  }

  private loadBusiness(slug: string): void {
    this.menuService
      .getBusinessPublicInfo(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: dto => {
          this.business.set(dto);
        },
        error: err => {
          console.error('Error loading public business info:', err);
        }
      });
  }

  private loadMenu(slug: string): void {
    this.menuService
      .getMenuBySlug(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories: Category[]) => {
          this.menuCategories.set(categories);

          this.categories.set(
            categories.map(c => ({
              id: c.id,
              name: c.name,
              icon: c.icon ?? null,
              color: c.color,
              colorHue: c.colorHue
            }))
          );

          this.categoryStartIndex.set(0);

          const firstCategory = this.categories()[0];
          if (firstCategory) {
            this.activeCategoryId.set(firstCategory.id);
          }

          this.isLoading.set(false);
        },
        error: err => {
          console.error('Error loading public menu:', err);
          this.isLoading.set(false);
        }
      });
  }

  private startHeroRotation(): void {
    const step = (this.HERO_TICK_MS / this.HERO_DURATION_MS) * 100;

    this.heroIntervalId = setInterval(() => {
      const nextProgress = this.heroProgress() + step;

      if (nextProgress >= 100) {
        const nextIndex =
          (this.currentHeroIndex() + 1) % this.heroImages.length;
        this.setHeroIndex(nextIndex);
      } else {
        this.heroProgress.set(nextProgress);
      }
    }, this.HERO_TICK_MS);

    this.destroyRef.onDestroy(() => {
      clearInterval(this.heroIntervalId);
    });
  }

  private setHeroIndex(index: number): void {
    if (index === this.currentHeroIndex()) {
      return;
    }

    this.isHeroFading.set(true);
    this.heroProgress.set(0);

    const ANIMATION_DURATION = 600;
    const HALF_DURATION = ANIMATION_DURATION / 2;

    setTimeout(() => {
      this.currentHeroIndex.set(index);
    }, HALF_DURATION);

    setTimeout(() => {
      this.isHeroFading.set(false);
    }, ANIMATION_DURATION);
  }

  // Now hero animations listen to scrollHost instead of window
  private setupHeroScrollAnimation(): void {
    const el = this.scrollHost;

    fromEvent(el, 'scroll')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const top = el.scrollTop || 0;
        const clamped = Math.max(0, Math.min(top, 400));
        this.heroScrollY.set(clamped);
      });
  }

  private setupResponsiveListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobile.set(window.innerWidth <= 640);

    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isMobile.set(window.innerWidth <= 640);
      });
  }

  onSelectHero(index: number): void {
    this.setHeroIndex(index);
  }

  onSelectCategory(categoryId: number): void {
    this.activeCategoryId.set(categoryId);
    this.scrollToCategories();
  }

  scrollCategoriesLeft(): void {
    if (!this.canScrollCategoriesLeft()) {
      return;
    }
    this.categoryStartIndex.update(current => Math.max(0, current - 1));
  }

  scrollCategoriesRight(): void {
    const total = this.categories().length;
    const windowSize = this.isMobile()
      ? this.MOBILE_VISIBLE_CATEGORIES
      : this.DESKTOP_VISIBLE_CATEGORIES;

    if (!this.canScrollCategoriesRight()) {
      return;
    }
    this.categoryStartIndex.update(current =>
      Math.min(current + 1, Math.max(0, total - windowSize))
    );
  }

  scrollToCategories(): void {
    const section = this.categoriesSectionRef();
    if (!section) {
      return;
    }
    section.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  getProductImageSrc(imageUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return this.imageBaseUrl + imageUrl;
  }

  trackByProductId(_index: number, item: Product): number {
    return item.id;
  }

  private buildTitleFromSlug(slug: string | null): string | null {
    if (!slug) {
      return null;
    }
    return slug
      .split('-')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}
