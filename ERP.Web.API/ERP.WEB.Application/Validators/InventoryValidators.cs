using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateInventoryValidator : AbstractValidator<CreateInventoryDto>
{
    public CreateInventoryValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("ProductId must be a positive integer.");
        RuleFor(x => x.PurchaseCost).GreaterThanOrEqualTo(0).WithMessage("PurchaseCost must be zero or greater.");
        RuleFor(x => x.SuggestedRetailPrice).GreaterThanOrEqualTo(0).WithMessage("SuggestedRetailPrice must be zero or greater.");
        RuleFor(x => x.CurrentStock).GreaterThanOrEqualTo(0).WithMessage("CurrentStock must be zero or greater.");
    }
}

public class UpdateInventoryValidator : AbstractValidator<UpdateInventoryDto>
{
    public UpdateInventoryValidator()
    {
        RuleFor(x => x.InventoryId).GreaterThan(0).WithMessage("InventoryId must be a positive integer.");
        RuleFor(x => x.PurchaseCost).GreaterThanOrEqualTo(0).WithMessage("PurchaseCost must be zero or greater.");
        RuleFor(x => x.SuggestedRetailPrice).GreaterThanOrEqualTo(0).WithMessage("SuggestedRetailPrice must be zero or greater.");
        RuleFor(x => x.CurrentStock).GreaterThanOrEqualTo(0).WithMessage("CurrentStock must be zero or greater.");
    }
}

public class RestockInventoryValidator : AbstractValidator<RestockInventoryDto>
{
    public RestockInventoryValidator()
    {
        RuleFor(x => x.AdditionalStock).GreaterThan(0).WithMessage("AdditionalStock must be greater than zero.");
    }
}
