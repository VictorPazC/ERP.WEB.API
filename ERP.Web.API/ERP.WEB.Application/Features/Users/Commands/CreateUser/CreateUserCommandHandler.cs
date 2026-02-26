using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
{
    private readonly IUserRepository _userRepository;

    public CreateUserCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async ValueTask<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Name = request.UserDto.Name,
            Email = request.UserDto.Email,
            Role = request.UserDto.Role,
            PasswordHash = string.IsNullOrWhiteSpace(request.UserDto.Password)
                ? null
                : BCrypt.Net.BCrypt.HashPassword(request.UserDto.Password),
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
