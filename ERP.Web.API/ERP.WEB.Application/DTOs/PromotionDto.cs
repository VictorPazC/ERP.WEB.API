namespace ERP.WEB.Application.DTOs;

public record PromotionDto(
    int PromoId,
    int ProductId,
    string? ProductName,
    decimal? DiscountPercentage,
    DateTime StartDate,
    DateTime EndDate,
    bool IsActive
);
