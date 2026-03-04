using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateConsumptionValidator : AbstractValidator<CreateConsumptionDto>
{
    public CreateConsumptionValidator()
    {
        RuleFor(x => x.InventoryId).GreaterThan(0).WithMessage("InventoryId must be a positive integer.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}

public class UpdateConsumptionValidator : AbstractValidator<UpdateConsumptionDto>
{
    public UpdateConsumptionValidator()
    {
        RuleFor(x => x.ConsumptionId).GreaterThan(0).WithMessage("ConsumptionId must be a positive integer.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}
