using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto?>
{
    private readonly IUserRepository _userRepository;

    public LoginCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async ValueTask<LoginResultDto?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.LoginDto.Email);

        if (user is null || user.PasswordHash is null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.LoginDto.Password, user.PasswordHash))
            return null;

        return new LoginResultDto(
            user.UserId,
            user.Name,
            user.Email,
            user.Role
        );
    }
}
