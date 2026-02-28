using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Queries.GetBrandById;

public record GetBrandByIdQuery(int BrandId) : IRequest<BrandDto?>;
