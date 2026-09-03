export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'archived';

export type ProductCategory = '奶茶類' | '純茶類' | '果茶類' | '特調類' | '鮮奶類' | '季節限定' | '手作特調' | '鮮果茶系列' | '奶蓋與冰沙' | '冬季限定溫飲' | string;

export interface RecipeIngredient {
  id?: string;
  materialId?: string;
  materialName: string;
  amount: number;
  unit: string;
  estimatedCost?: number;
}

export interface ProductRecipe {
  tea?: string;
  teaAmount?: number;
  milk?: string;
  milkAmount?: number;
  topping?: string;
  toppingAmount?: number;
  syrup?: string;
  syrupAmount?: number;
  cupType?: string;
  ingredients?: RecipeIngredient[];
  [key: string]: any;
}

export interface ProductRecipeItem {
  materialName: string;
  amount: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  englishName?: string;
  enName?: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stockCups: number;
  lowStockThreshold: number;
  status: ProductStatus;
  trend?: number[];
  salesTrend?: number[];
  trendDirection?: 'up' | 'down' | 'neutral';
  weeklySales: number;
  sugarOptions?: string[];
  iceOptions?: string[];
  temperatureTypes?: string[];
  size?: string;
  tags?: string[];
  lastRestocked?: string;
  recipe?: ProductRecipe;
  description: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: '茶葉原料' | '乳品配料' | '現煮配料' | '風味糖漿' | '包裝耗材' | string;
  currentStock: number;
  unit: string;
  safetyStock: number;
  unitCost: number;
  supplier: string;
  expirationDate?: string;
  status: 'normal' | 'low' | 'urgent';
  lastRestocked?: string;
}

export interface OrderItem {
  productId?: string;
  productName: string;
  price?: number;
  quantity: number;
  sugar?: string;
  ice?: string;
  toppings?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount?: number;
  totalPrice?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  orderType?: 'dine_in' | 'takeout' | 'delivery';
  createdAt?: string;
  time?: string;
  timeAgo?: string;
  sugarIce?: string;
}

export type LiveOrder = Order;

export interface StoreMetric {
  totalProducts: number;
  productGrowth: number;
  totalInventoryValue: number;
  lowStockCount: number;
  weeklySalesCount: number;
  salesGrowth: number;
  todayRevenue: number;
  todayOrders: number;
}
