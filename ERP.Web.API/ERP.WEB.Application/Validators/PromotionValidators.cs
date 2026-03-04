using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreatePromotionValidator : AbstractValidator<CreatePromotionDto>
{
    public CreatePromotionValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("ProductId must be a positive integer.");
        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0m, 100m).WithMessage("DiscountPercentage must be between 0 and 100.")
            .When(x => x.DiscountPercentage.HasValue);
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate).WithMessage("EndDate must be after StartDate.");
    }
}

public class UpdatePromotionValidator : AbstractValidator<UpdatePromotionDto>
{
    public UpdatePromotionValidator()
    {
        RuleFor(x => x.PromoId).GreaterThan(0).WithMessage("PromoId must be a positive integer.");
        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(0m, 100m).WithMessage("DiscountPercentage must be between 0 and 100.")
            .When(x => x.DiscountPercentage.HasValue);
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate).WithMessage("EndDate must be after StartDate.");
    }
}
