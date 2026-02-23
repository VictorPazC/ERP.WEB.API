namespace ERP.WEB.Application.DTOs;

public record UpdatePromotionDto(
    int PromoId,
    decimal? DiscountPercentage,
    DateTime StartDate,
    DateTime EndDate
);
