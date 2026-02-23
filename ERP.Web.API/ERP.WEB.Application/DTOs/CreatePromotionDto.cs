namespace ERP.WEB.Application.DTOs;

public record CreatePromotionDto(
    int ProductId,
    decimal? DiscountPercentage,
    DateTime StartDate,
    DateTime EndDate
);
