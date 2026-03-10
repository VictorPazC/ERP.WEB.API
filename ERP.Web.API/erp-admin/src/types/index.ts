export interface CursorPagedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Brand {
  brandId: number;
  name: string;
  description?: string;
  productsCount: number;
  isDefault: boolean;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
}

export interface UpdateBrandDto {
  brandId: number;
  name: string;
  description?: string;
}

export interface Category {
  categoryId: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  subCategoriesCount: number;
  productsCount: number;
  imagePath?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: number;
  imagePath?: string;
}

export interface UpdateCategoryDto {
  categoryId: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  imagePath?: string;
}

export type StockStatus = 'NeedToOrder' | 'OnTheWay' | 'Disabled' | 'OrderLater';

export interface Product {
  productId: number;
  name: string;
  description?: string;
  brandId?: number;
  brandName?: string;
  referenceLink?: string;
  purchaseLocation?: string;
  status: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
  isFavorite: boolean;
  stockStatus?: StockStatus;
  hasInventory: boolean;
  currentStock?: number;
  variantCount: number;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  brandId?: number;
  referenceLink?: string;
  purchaseLocation?: string;
  categoryId?: number;
}

export interface UpdateProductDto {
  productId: number;
  name: string;
  description?: string;
  brandId?: number;
  referenceLink?: string;
  purchaseLocation?: string;
  status: string;
  categoryId?: number;
}

export interface Inventory {
  inventoryId: number;
  productId: number;
  productName?: string;
  variantId?: number;
  variantName?: string;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  estimatedProfit: number;
  lastRestockDate: string;
  lastSaleDate?: string;
  needsRestock: boolean;
}

export interface ProductVariant {
  variantId: number;
  productId: number;
  name: string;
  description?: string;
  createdAt: string;
  hasInventory: boolean;
  currentStock?: number;
  primaryImagePath?: string;
  stockStatus?: string | null;
}

export interface CreateProductVariantDto {
  productId: number;
  name?: string;
  description?: string;
}

export interface UpdateProductVariantDto {
  variantId: number;
  name: string;
  description?: string;
  stockStatus?: string | null;
}

export interface CreateInventoryDto {
  productId: number;
  variantId?: number;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  lowStockThreshold?: number;
  lastRestockDate: string;
  lastSaleDate?: string;
}

export interface UpdateInventoryDto {
  inventoryId: number;
  variantId?: number;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  lowStockThreshold?: number;
  lastRestockDate: string;
  lastSaleDate?: string;
  needsRestock: boolean;
}

export interface RestockInventoryDto {
  additionalStock: number;
  needsRestock: boolean;
}

export interface Tag {
  tagId: number;
  tagName: string;
  productsCount: number;
}

export interface CreateTagDto {
  tagName: string;
}

export interface UpdateTagDto {
  tagId: number;
  tagName: string;
}

export interface Promotion {
  promoId: number;
  productId: number;
  productName?: string;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreatePromotionDto {
  productId: number;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
}

export interface UpdatePromotionDto {
  promoId: number;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
}

export interface ProductImage {
  imageId: number;
  productId: number;
  variantId?: number;
  variantName?: string;
  imagePath: string;
  isPrimary: boolean;
  displayOrder: number;
  registeredAt: string;
}

export interface CreateProductImageDto {
  productId: number;
  imagePath: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface UpdateProductImageDto {
  imageId: number;
  imagePath: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export interface UpdateUserDto {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  companyId?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResultDto {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  companyId: number;
  companyName: string;
  isSuperAdmin: boolean;
  companies?: CompanySummary[];
  refreshToken: string;
  refreshTokenExpiry: string;
}

export interface CompanySummary {
  companyId: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface Company {
  companyId: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  customDomain?: string;
  primaryColor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCompanyDto {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  customDomain?: string;
  primaryColor?: string;
}

export interface UpdateCompanyDto {
  companyId: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  customDomain?: string;
  primaryColor?: string;
  isActive: boolean;
}

export interface AvailableArticle {
  inventoryId: number;
  productId: number;
  productName: string;
  categoryName?: string;
  categoryId: number;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  variantId?: number;
  variantName?: string;
}

export interface Consumption {
  consumptionId: number;
  inventoryId: number;
  productId: number;
  productName?: string;
  categoryName?: string;
  quantity: number;
  consumedAt: string;
  notes?: string;
  paymentMethod?: string;
}

export interface CreateConsumptionDto {
  inventoryId: number;
  quantity: number;
  consumedAt: string;
  notes?: string;
  paymentMethod?: string;
}

export type OrderStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface OrderItem {
  orderItemId: number;
  inventoryId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  orderId: number;
  status: OrderStatus;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  paymentMethod?: string;
}

export interface CreateOrderItemDto {
  inventoryId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  notes?: string;
  items: CreateOrderItemDto[];
  paymentMethod?: string;
}

export interface WeeklyStat {
  day: string;
  ganancia: number;
  pedidos: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  value: number;
  metric: string;
}

export interface ActivityLog {
  activityLogId: number;
  type: string;
  title: string;
  description?: string;
  amount?: number;
  timestamp: string;
}

export interface CriticalInventory {
  inventoryId: number;
  productId: number;
  productName?: string;
  currentStock: number;
  variantId?: number;
  variantName?: string;
}
