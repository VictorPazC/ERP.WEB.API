using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantById;

// Cubre el endpoint GET /api/product-variants/{id} faltante en ProductVariantsController.
public record GetVariantByIdQuery(int VariantId) : IRequest<ProductVariantDto?>;
