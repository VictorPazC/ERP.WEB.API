using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.UpdateVariant;

public record UpdateVariantCommand(UpdateProductVariantDto Dto) : IRequest<bool>;
