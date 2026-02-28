namespace ERP.WEB.Application.DTOs;

public record CreateProductDto(
    string Name,
    string? Description,
    int? BrandId,
    string? ReferenceLink,
    string? PurchaseLocation,
    int? CategoryId
);