using ERP.WEB.Application.DTOs;
using FluentValidation;

namespace ERP.WEB.Application.Validators;

// Valores válidos de rol — en FASE 5 se reemplazará por enum UserRole.
file static class ValidUserValues
{
    public static readonly string[] Roles    = ["SuperAdmin", "Admin", "Viewer"];
    public static readonly string[] Statuses = ["Active", "Inactive"];
}

public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.").MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => ValidUserValues.Roles.Contains(r))
            .WithMessage("Role must be one of: SuperAdmin, Admin, Viewer.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");
    }
}

public class UpdateUserValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0).WithMessage("UserId must be a positive integer.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.").MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => ValidUserValues.Roles.Contains(r))
            .WithMessage("Role must be one of: SuperAdmin, Admin, Viewer.");
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => ValidUserValues.Statuses.Contains(s))
            .WithMessage("Status must be one of: Active, Inactive.");
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required.");
    }
}
