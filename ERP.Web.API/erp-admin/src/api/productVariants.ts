import client from './client';
import type { ProductVariant, CreateProductVariantDto, UpdateProductVariantDto } from '../types';

export const productVariantsApi = {
  getByProduct: (productId: number) =>
    client.get<ProductVariant[]>(`/api/product-variants/product/${productId}`).then(r => r.data),
  create: (dto: CreateProductVariantDto) =>
    client.post<number>('/api/product-variants', dto).then(r => r.data),
  update: (id: number, dto: UpdateProductVariantDto) =>
    client.put(`/api/product-variants/${id}`, dto),
  delete: (id: number) =>
    client.delete(`/api/product-variants/${id}`),
};
