using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
    }
}

public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("ProductId must be a positive integer.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
        // Status se valida en SetStockStatusCommandHandler vía enum StockStatus (Decisión 5A).
        // FASE 3 no agrega validación de Status en UpdateProduct para no bloquear otros valores internos.
    }
}
