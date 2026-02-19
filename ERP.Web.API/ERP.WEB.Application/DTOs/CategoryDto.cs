namespace ERP.WEB.Application.DTOs;

public record CategoryDto(
    int CategoryId,
    string Name,
    string? Description,
    int? ParentCategoryId,
    string? ParentCategoryName,
    int SubCategoriesCount,
    int ProductsCount
);
