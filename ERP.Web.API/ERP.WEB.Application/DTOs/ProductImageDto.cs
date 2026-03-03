namespace ERP.WEB.Application.DTOs;

public record ProductImageDto(
    int ImageId,
    int ProductId,
    string ImagePath,
    bool IsPrimary,
    int DisplayOrder,
    DateTime RegisteredAt,
    int? VariantId
);
