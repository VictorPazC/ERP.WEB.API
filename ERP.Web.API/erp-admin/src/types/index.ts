export interface Category {
  categoryId: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  subCategoriesCount: number;
  productsCount: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: number;
}

export interface UpdateCategoryDto {
  categoryId: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
}

export interface Product {
  productId: number;
  name: string;
  description?: string;
  brand?: string;
  referenceLink?: string;
  purchaseLocation?: string;
  status: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  brand?: string;
  referenceLink?: string;
  purchaseLocation?: string;
  categoryId?: number;
}

export interface UpdateProductDto {
  productId: number;
  name: string;
  description?: string;
  brand?: string;
  referenceLink?: string;
  purchaseLocation?: string;
  status: string;
  categoryId?: number;
}

export interface Inventory {
  inventoryId: number;
  productId: number;
  productName?: string;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  estimatedProfit: number;
  lastRestockDate: string;
  lastSaleDate?: string;
}

export interface CreateInventoryDto {
  productId: number;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  lastRestockDate: string;
  lastSaleDate?: string;
}

export interface UpdateInventoryDto {
  inventoryId: number;
  purchaseCost: number;
  suggestedRetailPrice: number;
  currentStock: number;
  lastRestockDate: string;
  lastSaleDate?: string;
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
}

export interface UpdateUserDto {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
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
}

export interface CreateConsumptionDto {
  inventoryId: number;
  quantity: number;
  consumedAt: string;
  notes?: string;
}
