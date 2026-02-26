using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UserDto?>
{
    private readonly IUserRepository _userRepository;

    public UpdateUserCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async ValueTask<UserDto?> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserDto.UserId);
        if (user is null) return null;

        user.Name = request.UserDto.Name;
        user.Email = request.UserDto.Email;
        user.Role = request.UserDto.Role;
        user.Status = request.UserDto.Status;
        if (!string.IsNullOrWhiteSpace(request.UserDto.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.UserDto.Password);

        await _userRepository.UpdateAsync(user);

        return new UserDto(
            user.UserId,
            user.Name,
            user.Email,
            user.Role,
            user.Status,
            user.CreatedAt
        );
    }
}
