import client from '../../shared/api/client';
import type { ProductVariant, CreateProductVariantDto, UpdateProductVariantDto } from '../../shared/types';

export const productVariantsApi = {
  getByProduct: (productId: number) =>
    client.get<ProductVariant[]>(`/api/product-variants/product/${productId}`),
  create: (dto: CreateProductVariantDto) =>
    client.post<number>('/api/product-variants', dto),
  update: (id: number, dto: UpdateProductVariantDto) =>
    client.put(`/api/product-variants/${id}`, dto),
  delete: (id: number) =>
    client.delete(`/api/product-variants/${id}`),
};
