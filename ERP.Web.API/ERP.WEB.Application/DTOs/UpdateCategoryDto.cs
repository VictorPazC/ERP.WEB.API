namespace ERP.WEB.Application.DTOs;

public record UpdateCategoryDto(
    int CategoryId,
    string Name,
    string? Description,
    int? ParentCategoryId,
    string? ImagePath = null
);
