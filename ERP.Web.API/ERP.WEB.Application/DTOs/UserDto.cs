namespace ERP.WEB.Application.DTOs;

public record UserDto(
    int UserId,
    string Name,
    string Email,
    string Role,
    string Status,
    DateTime CreatedAt
);

public record CreateUserDto(
    string Name,
    string Email,
    string Role,
    string? Password
);

public record UpdateUserDto(
    int UserId,
    string Name,
    string Email,
    string Role,
    string Status,
    string? Password
);

public record LoginDto(
    string Email,
    string Password
);

public record LoginResultDto(
    string Token,
    int UserId,
    string Name,
    string Email,
    string Role,
    int CompanyId,
    string CompanyName,
    bool IsSuperAdmin,
    CompanySummaryDto[]? Companies
);

public record CompanySummaryDto(
    int CompanyId,
    string Name,
    string Slug,
    string? LogoUrl
);
