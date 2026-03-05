using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.SeedSuperAdmin;

public class SeedSuperAdminCommandHandler : IRequestHandler<SeedSuperAdminCommand, UserDto?>
{
    private readonly IUserRepository _userRepository;

    public SeedSuperAdminCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async ValueTask<UserDto?> Handle(SeedSuperAdminCommand request, CancellationToken cancellationToken)
    {
        // Guard: sólo si no existe ningún SuperAdmin todavía
        if (await _userRepository.AnySuperAdminAsync(cancellationToken))
            return null;

        var user = new User
        {
            Name         = request.Dto.Name,
            Email        = request.Dto.Email,
            Role         = "SuperAdmin",
            IsSuperAdmin = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Dto.Password),
        };

        var created = await _userRepository.AddAsync(user);

        return new UserDto(
            created.UserId,
            created.Name,
            created.Email,
            created.Role,
            created.Status,
            created.CreatedAt
        );
    }
}
