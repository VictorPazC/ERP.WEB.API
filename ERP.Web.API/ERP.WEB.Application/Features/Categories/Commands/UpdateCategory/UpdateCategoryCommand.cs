using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(UpdateCategoryDto CategoryDto) : IRequest<CategoryDto?>;
