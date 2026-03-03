using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.CreateVariant;

public record CreateVariantCommand(CreateProductVariantDto Dto) : IRequest<int>;
