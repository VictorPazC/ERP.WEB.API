using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResultDto?>
{
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUserRepository _userRepo;
    private readonly ICompanyRepository _companyRepo;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(
        IRefreshTokenRepository refreshTokenRepo,
        IUserRepository userRepo,
        ICompanyRepository companyRepo,
        ITokenService tokenService)
    {
        _refreshTokenRepo = refreshTokenRepo;
        _userRepo         = userRepo;
        _companyRepo      = companyRepo;
        _tokenService     = tokenService;
    }

    public async ValueTask<LoginResultDto?> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var existing = await _refreshTokenRepo.GetByTokenAsync(request.Token, cancellationToken);

        if (existing is null || existing.IsRevoked || existing.ExpiresAt <= DateTime.UtcNow)
            return null;

        var user = await _userRepo.GetByIdAsync(existing.UserId);
        if (user is null) return null;

        // Revoke old token (rotation pattern — un token solo se usa una vez)
        await _refreshTokenRepo.RevokeAsync(request.Token, cancellationToken);

        // Generate new tokens
        var newJwt = _tokenService.GenerateToken(user);
        var (newRefreshToken, newRefreshExpiry) = _tokenService.GenerateRefreshToken();

        await _refreshTokenRepo.AddAsync(new RefreshToken
        {
            Token     = newRefreshToken,
            UserId    = user.UserId,
            ExpiresAt = newRefreshExpiry
        }, cancellationToken);

        // Get company info
        var company     = await _companyRepo.GetByIdAsync(user.CompanyId);
        var companyName = company?.Name ?? "Unknown";

        CompanySummaryDto[]? companies = null;
        if (user.IsSuperAdmin)
        {
            var allCompanies = await _companyRepo.GetAllAsync(new CursorParams(null, 10_000), cancellationToken);
            companies = allCompanies
                .Where(c => c.IsActive)
                .Select(c => new CompanySummaryDto(c.CompanyId, c.Name, c.Slug, c.LogoUrl))
                .ToArray();
        }

        return new LoginResultDto(
            newJwt,
            user.UserId,
            user.Name,
            user.Email,
            user.Role,
            user.CompanyId,
            companyName,
            user.IsSuperAdmin,
            companies,
            newRefreshToken,
            newRefreshExpiry
        );
    }
}
