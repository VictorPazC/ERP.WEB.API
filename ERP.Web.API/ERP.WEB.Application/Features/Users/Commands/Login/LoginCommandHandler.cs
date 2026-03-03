using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto?>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ICompanyRepository _companyRepo;

    public LoginCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        ICompanyRepository companyRepo)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _companyRepo = companyRepo;
    }

    public async ValueTask<LoginResultDto?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.LoginDto.Email);

        if (user is null || user.PasswordHash is null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.LoginDto.Password, user.PasswordHash))
            return null;

        // Generate JWT token
        var token = _tokenService.GenerateToken(user);

        // Get company info
        var company = await _companyRepo.GetByIdAsync(user.CompanyId);
        var companyName = company?.Name ?? "Unknown";

        // If SuperAdmin, include list of all companies
        CompanySummaryDto[]? companies = null;
        if (user.IsSuperAdmin)
        {
            var allCompanies = await _companyRepo.GetAllAsync();
            companies = allCompanies
                .Where(p => p.IsActive)
                .Select(p => new CompanySummaryDto(p.CompanyId, p.Name, p.Slug, p.LogoUrl))
                .ToArray();
        }

        return new LoginResultDto(
            token,
            user.UserId,
            user.Name,
            user.Email,
            user.Role,
            user.CompanyId,
            companyName,
            user.IsSuperAdmin,
            companies
        );
    }
}
