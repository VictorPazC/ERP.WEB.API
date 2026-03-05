using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
{
    private readonly IUserRepository _userRepository;
    private readonly ICompanyContext _companyContext;

    public CreateUserCommandHandler(IUserRepository userRepository, ICompanyContext companyContext)
    {
        _userRepository = userRepository;
        _companyContext = companyContext;
    }

    public async ValueTask<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Name = request.UserDto.Name,
            Email = request.UserDto.Email,
            Role = request.UserDto.Role,
            // Assign company from current request context (set by TenantMiddleware + X-Company-Id header).
            CompanyId = _companyContext.CompanyId > 0 ? _companyContext.CompanyId : (int?)null,
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
