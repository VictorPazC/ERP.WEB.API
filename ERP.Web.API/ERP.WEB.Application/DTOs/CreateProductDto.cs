namespace ERP.WEB.Application.DTOs;

public record CreateProductDto(
    string Name,
    string? Description,
    string? Brand,
    string? ReferenceLink,
    string? PurchaseLocation,
    int? CategoryId
);