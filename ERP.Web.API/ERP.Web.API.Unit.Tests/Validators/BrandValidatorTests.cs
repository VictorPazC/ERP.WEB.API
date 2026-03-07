using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Validators;
using FluentValidation.TestHelper;

namespace ERP.Web.API.Unit.Tests.Validators;

public class BrandValidatorTests
{
    private readonly CreateBrandValidator _createValidator = new();
    private readonly UpdateBrandValidator _updateValidator = new();

    // ── CreateBrandValidator ─────────────────────────────────────────────────

    [Fact]
    public void Create_WhenNameEmpty_FailsValidation()
    {
        var result = _createValidator.TestValidate(new CreateBrandDto("", null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Create_WhenNameExceeds100Chars_FailsValidation()
    {
        var longName = new string('A', 101);
        var result = _createValidator.TestValidate(new CreateBrandDto(longName, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Create_WhenNameValid_PassesValidation()
    {
        var result = _createValidator.TestValidate(new CreateBrandDto("Valid Name", "Optional desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_WhenDescriptionNull_PassesValidation()
    {
        var result = _createValidator.TestValidate(new CreateBrandDto("Name", null));
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ── UpdateBrandValidator ─────────────────────────────────────────────────

    [Fact]
    public void Update_WhenBrandIdZero_FailsValidation()
    {
        var result = _updateValidator.TestValidate(new UpdateBrandDto(0, "Name", null));
        result.ShouldHaveValidationErrorFor(x => x.BrandId);
    }

    [Fact]
    public void Update_WhenNameValid_PassesValidation()
    {
        var result = _updateValidator.TestValidate(new UpdateBrandDto(1, "Valid Name", null));
        result.ShouldNotHaveAnyValidationErrors();
    }
}
