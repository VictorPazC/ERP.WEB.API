using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

public class CreateTagValidator : AbstractValidator<CreateTagDto>
{
    public CreateTagValidator()
    {
        RuleFor(x => x.TagName)
            .NotEmpty().WithMessage("TagName is required.")
            .MaximumLength(50).WithMessage("TagName must not exceed 50 characters.");
    }
}

public class UpdateTagValidator : AbstractValidator<UpdateTagDto>
{
    public UpdateTagValidator()
    {
        RuleFor(x => x.TagId).GreaterThan(0).WithMessage("TagId must be a positive integer.");
        RuleFor(x => x.TagName)
            .NotEmpty().WithMessage("TagName is required.")
            .MaximumLength(50).WithMessage("TagName must not exceed 50 characters.");
    }
}
