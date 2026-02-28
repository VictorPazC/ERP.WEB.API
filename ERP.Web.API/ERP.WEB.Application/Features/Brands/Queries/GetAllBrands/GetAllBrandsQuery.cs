using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;

public record GetAllBrandsQuery : IRequest<IEnumerable<BrandDto>>;
