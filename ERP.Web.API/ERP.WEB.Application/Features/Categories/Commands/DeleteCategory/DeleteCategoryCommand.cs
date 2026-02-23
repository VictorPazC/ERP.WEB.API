using Mediator;

namespace ERP.WEB.Application.Features.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(int CategoryId) : IRequest<bool>;
