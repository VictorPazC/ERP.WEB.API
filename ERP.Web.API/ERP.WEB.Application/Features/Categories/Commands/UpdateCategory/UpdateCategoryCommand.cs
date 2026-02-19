using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(UpdateCategoryDto CategoryDto) : IRequest<CategoryDto?>;
