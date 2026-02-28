using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.DeleteBrand;

public record DeleteBrandCommand(int BrandId) : IRequest<bool>;
