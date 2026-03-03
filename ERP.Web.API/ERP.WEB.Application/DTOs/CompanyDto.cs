namespace ERP.WEB.Application.DTOs;

public record CompanyDto(
    int CompanyId,
    string Name,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? CustomDomain,
    string? PrimaryColor,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateCompanyDto(
    string Name,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? CustomDomain,
    string? PrimaryColor
);

public record UpdateCompanyDto(
    int CompanyId,
    string Name,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? CustomDomain,
    string? PrimaryColor,
    bool IsActive
);
