using Mediator;

namespace ERP.WEB.Application.Features.Brands.Commands.SetDefaultBrand;

public record SetDefaultBrandCommand(int BrandId) : IRequest<bool>;
