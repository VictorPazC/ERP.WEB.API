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
    string Role
);

public record UpdateUserDto(
    int UserId,
    string Name,
    string Email,
    string Role,
    string Status
);
