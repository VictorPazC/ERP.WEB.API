import { describe, it, expect, beforeEach } from 'vitest';
import { imageUrl } from '../../utils/imageUrl';

describe('imageUrl', () => {
  it('returns undefined for undefined path', () => {
    expect(imageUrl(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(imageUrl('')).toBeUndefined();
  });

  it('returns path unchanged when it starts with http', () => {
    const url = 'https://cdn.example.com/image.png';
    expect(imageUrl(url)).toBe(url);
  });

  it('prepends API base for relative path with leading slash', () => {
    const result = imageUrl('/uploads/products/img.png');
    expect(result).toMatch(/\/uploads\/products\/img\.png$/);
  });

  it('prepends API base with slash for relative path without leading slash', () => {
    const result = imageUrl('uploads/products/img.png');
    expect(result).toMatch(/\/uploads\/products\/img\.png$/);
  });
});
