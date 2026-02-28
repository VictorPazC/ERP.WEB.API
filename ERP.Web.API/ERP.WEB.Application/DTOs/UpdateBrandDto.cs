namespace ERP.WEB.Application.DTOs;

public record UpdateBrandDto(
    int BrandId,
    string Name,
    string? Description
);
