using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;
using RefreshTokenEntity = ERP.WEB.Domain.Entities.RefreshToken;

namespace ERP.WEB.Application.Features.Users.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResultDto?>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ICompanyRepository _companyRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;

    public LoginCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        ICompanyRepository companyRepo,
        IRefreshTokenRepository refreshTokenRepo)
    {
        _userRepository   = userRepository;
        _tokenService     = tokenService;
        _companyRepo      = companyRepo;
        _refreshTokenRepo = refreshTokenRepo;
    }

    public async ValueTask<LoginResultDto?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.LoginDto.Email);

        if (user is null || user.PasswordHash is null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.LoginDto.Password, user.PasswordHash))
            return null;

        // Usuarios normales (no SuperAdmin) deben tener una compañía asignada
        if (!user.IsSuperAdmin && !user.CompanyId.HasValue)
            return null;

        // Generate JWT token
        var token = _tokenService.GenerateToken(user);

        // Generate refresh token and persist it
        var (refreshToken, refreshExpiry) = _tokenService.GenerateRefreshToken();
        await _refreshTokenRepo.AddAsync(new RefreshTokenEntity
        {
            Token     = refreshToken,
            UserId    = user.UserId,
            ExpiresAt = refreshExpiry
        }, cancellationToken);

        // Get company info (CompanyId is null for SuperAdmin — returns unknown)
        var company     = user.CompanyId.HasValue ? await _companyRepo.GetByIdAsync(user.CompanyId.Value) : null;
        var companyName = company?.Name ?? string.Empty;

        // If SuperAdmin, include list of all companies
        CompanySummaryDto[]? companies = null;
        if (user.IsSuperAdmin)
        {
            var allCompanies = await _companyRepo.GetAllAsync(new CursorParams(null, 10_000), cancellationToken);
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
            user.CompanyId ?? 0,
            companyName,
            user.IsSuperAdmin,
            companies,
            refreshToken,
            refreshExpiry
        );
    }
}
