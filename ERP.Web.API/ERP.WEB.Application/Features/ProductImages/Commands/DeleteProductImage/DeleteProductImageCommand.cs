using Mediator;

namespace ERP.WEB.Application.Features.ProductImages.Commands.DeleteProductImage;

public record DeleteProductImageCommand(int ImageId) : IRequest<bool>;
