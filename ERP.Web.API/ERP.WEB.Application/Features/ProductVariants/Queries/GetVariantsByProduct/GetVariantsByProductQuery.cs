using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantsByProduct;

public record GetVariantsByProductQuery(int ProductId, CursorParams Params) : IRequest<CursorPagedResult<ProductVariantDto>>;
