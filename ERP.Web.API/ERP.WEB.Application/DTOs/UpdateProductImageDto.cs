namespace ERP.WEB.Application.DTOs;

public record UpdateProductImageDto(
    int ImageId,
    string ImagePath,
    bool IsPrimary,
    int DisplayOrder
);
