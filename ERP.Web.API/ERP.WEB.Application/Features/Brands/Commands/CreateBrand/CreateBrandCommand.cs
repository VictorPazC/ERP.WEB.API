using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.CreateBrand;

public record CreateBrandCommand(CreateBrandDto BrandDto) : IRequest<BrandDto>;
