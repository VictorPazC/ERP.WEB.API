using ERP.WEB.Application.DTOs;
using MediatR;

namespace ERP.WEB.Application.Features.Categories.Commands.CreateCategory;

public record CreateCategoryCommand(CreateCategoryDto CategoryDto) : IRequest<CategoryDto>;
