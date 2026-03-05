import client from '../../shared/api/client';
import type { ProductImage, CreateProductImageDto, UpdateProductImageDto } from '../../shared/types';
import type { CursorPagedResult } from '../../shared/types';

export const productImagesApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<ProductImage>>('/api/product-images', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<ProductImage>(`/api/product-images/${id}`),
  getByProductId: (productId: number) => client.get<ProductImage[]>(`/api/product-images/product/${productId}`),
  create: (dto: CreateProductImageDto) => client.post<ProductImage>('/api/product-images', dto),
  upload: (file: File, productId: number, isPrimary: boolean, displayOrder: number, variantId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId.toString());
    formData.append('isPrimary', isPrimary.toString());
    formData.append('displayOrder', displayOrder.toString());
    if (variantId) formData.append('variantId', variantId.toString());
    return client.post<ProductImage>('/api/product-images/upload', formData);
  },
  update: (id: number, dto: UpdateProductImageDto) => client.put<ProductImage>(`/api/product-images/${id}`, dto),
  delete: (id: number) => client.delete(`/api/product-images/${id}`),
};
