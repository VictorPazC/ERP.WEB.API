import client from './client';
import type { ProductVariant, CreateProductVariantDto, UpdateProductVariantDto, CursorPagedResult } from '../types';

export const productVariantsApi = {
  getByProduct: async (productId: number): Promise<ProductVariant[]> => {
    const result = await client.get<CursorPagedResult<ProductVariant>>(`/api/product-variants/product/${productId}`);
    return result.items;
  },
  create: (dto: CreateProductVariantDto) =>
    client.post<number>('/api/product-variants', dto),
  update: (id: number, dto: UpdateProductVariantDto) =>
    client.put(`/api/product-variants/${id}`, dto),
  delete: (id: number) =>
    client.delete(`/api/product-variants/${id}`),
};
