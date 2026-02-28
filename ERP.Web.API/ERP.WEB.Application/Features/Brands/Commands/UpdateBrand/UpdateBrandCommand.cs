using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.UpdateBrand;

public record UpdateBrandCommand(UpdateBrandDto BrandDto) : IRequest<BrandDto?>;
