import client from './client';
import type { ProductImage, CreateProductImageDto, UpdateProductImageDto } from '../types';
import type { CursorPagedResult } from '../types';

export const productImagesApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<ProductImage>>('/api/product-images', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) => client.get<ProductImage>(`/api/product-images/${id}`).then(r => r.data),
  getByProductId: (productId: number) => client.get<ProductImage[]>(`/api/product-images/product/${productId}`).then(r => r.data),
  create: (dto: CreateProductImageDto) => client.post<ProductImage>('/api/product-images', dto).then(r => r.data),
  upload: (file: File, productId: number, isPrimary: boolean, displayOrder: number, variantId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId.toString());
    formData.append('isPrimary', isPrimary.toString());
    formData.append('displayOrder', displayOrder.toString());
    if (variantId) formData.append('variantId', variantId.toString());
    return client.post<ProductImage>('/api/product-images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  update: (id: number, dto: UpdateProductImageDto) => client.put<ProductImage>(`/api/product-images/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/product-images/${id}`),
};
