using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.DeleteVariant;

public record DeleteVariantCommand(int VariantId) : IRequest<bool>;
