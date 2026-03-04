using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);

    /// <summary>
    /// Genera un refresh token opaco (GUID) y su fecha de expiración.
    /// La expiración se lee de <c>Jwt:RefreshTokenExpiryDays</c> (default: 7 días).
    /// </summary>
    (string Token, DateTime ExpiresAt) GenerateRefreshToken();
}
