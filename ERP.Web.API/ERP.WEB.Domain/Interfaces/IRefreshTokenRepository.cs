using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<RefreshToken> AddAsync(RefreshToken refreshToken, CancellationToken ct = default);
    Task RevokeAsync(string token, CancellationToken ct = default);
}
