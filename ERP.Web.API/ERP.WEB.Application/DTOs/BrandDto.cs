namespace ERP.WEB.Application.DTOs;

public record BrandDto(
    int BrandId,
    string Name,
    string? Description,
    int ProductsCount
);
