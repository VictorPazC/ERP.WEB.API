using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateVariantValidator : AbstractValidator<CreateProductVariantDto>
{
    public CreateVariantValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("ProductId must be a positive integer.");
        // Name es opcional — si está vacío el handler auto-genera "v{n+1}".
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
            .When(x => !string.IsNullOrEmpty(x.Name));
    }
}

public class UpdateVariantValidator : AbstractValidator<UpdateProductVariantDto>
{
    public UpdateVariantValidator()
    {
        RuleFor(x => x.VariantId).GreaterThan(0).WithMessage("VariantId must be a positive integer.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
    }
}
