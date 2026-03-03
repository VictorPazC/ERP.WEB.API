namespace ERP.WEB.Application.DTOs;

public record CreateProductImageDto(
    int ProductId,
    string ImagePath,
    bool IsPrimary,
    int DisplayOrder,
    int? VariantId = null
);
