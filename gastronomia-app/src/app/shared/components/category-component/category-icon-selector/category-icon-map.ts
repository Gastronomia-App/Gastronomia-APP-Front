import {
  Coffee,
  Pizza,
  IceCream,
  Beer,
  Wine,
  Martini,
  Sandwich,
  Soup,
  Salad,
  Drumstick,
  Fish,
  Croissant,
  Sun,
  Moon,
  Flame,
  Star,
  Utensils,
  UtensilsCrossed,
  EggFried,
  CakeSlice,
  CupSoda,
  Baby,
  Package,
  Plus,
  Wheat,
  Beef
} from 'lucide-angular';

export const CATEGORY_ICON_MAP: Record<string, any> = {
  APPETIZERS: Utensils,
  SALADS: Salad,
  SOUPS: Soup,
  SEAFOOD: Fish,
  SPECIALTIES: Star,

  // ✅ Íconos únicos y semánticos
  MINUTAS: EggFried,
  PASTAS: Wheat,          // 🌾 Trigo
  MEAT: Beef,            // 🥩 Carne roja
  POULTRY: Drumstick,    // 🍗 Pollo cocinado
  PIZZAS: Pizza,
  SANDWICHES: Sandwich,
  BAKERY: Croissant,

  BREAKFAST: Sun,
  LUNCH: Utensils,
  DINNER: Moon,
  SIDES: Salad,

  DESSERTS: CakeSlice,
  ICE_CREAM: IceCream,

  BEVERAGES: CupSoda,
  BEER: Beer,
  WINE: Wine,
  COCKTAILS: Martini,
  COFFEE_AND_TEA: Coffee,

  SPICY: Flame,
  KIDS_MENU: Baby,
  COMBOS: Package,
  EXTRAS: Plus
};

export const CATEGORY_ICON_LABELS: Record<string, string> = {
  APPETIZERS: 'Entradas',
  SALADS: 'Ensaladas',
  SOUPS: 'Sopas',
  SEAFOOD: 'Mariscos',
  SPECIALTIES: 'Especialidades',

  MINUTAS: 'Minutas',
  PASTAS: 'Pastas',
  MEAT: 'Carnes',
  POULTRY: 'Aves',
  PIZZAS: 'Pizzas',
  SANDWICHES: 'Sándwiches',
  BAKERY: 'Panadería',

  BREAKFAST: 'Desayunos',
  LUNCH: 'Almuerzos',
  DINNER: 'Cenas',
  SIDES: 'Guarniciones',

  DESSERTS: 'Postres',
  ICE_CREAM: 'Helados',

  BEVERAGES: 'Bebidas',
  BEER: 'Cervezas',
  WINE: 'Vinos',
  COCKTAILS: 'Cócteles',
  COFFEE_AND_TEA: 'Café y Té',

  SPICY: 'Picante',
  KIDS_MENU: 'Menú infantil',
  COMBOS: 'Combos',
  EXTRAS: 'Extras'
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICON_MAP);
