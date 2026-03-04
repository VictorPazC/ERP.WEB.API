using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateProductImageValidator : AbstractValidator<CreateProductImageDto>
{
    public CreateProductImageValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("ProductId must be a positive integer.");
        RuleFor(x => x.ImagePath).NotEmpty().WithMessage("ImagePath is required.");
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0).WithMessage("DisplayOrder must be zero or greater.");
    }
}

public class UpdateProductImageValidator : AbstractValidator<UpdateProductImageDto>
{
    public UpdateProductImageValidator()
    {
        RuleFor(x => x.ImageId).GreaterThan(0).WithMessage("ImageId must be a positive integer.");
        RuleFor(x => x.ImagePath).NotEmpty().WithMessage("ImagePath is required.");
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0).WithMessage("DisplayOrder must be zero or greater.");
    }
}
