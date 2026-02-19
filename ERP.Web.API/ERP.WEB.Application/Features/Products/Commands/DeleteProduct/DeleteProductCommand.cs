using MediatR;

namespace ERP.WEB.Application.Features.Products.Commands.DeleteProduct;

public record DeleteProductCommand(int ProductId) : IRequest<bool>;