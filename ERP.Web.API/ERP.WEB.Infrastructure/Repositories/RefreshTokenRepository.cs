using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _context;

    public RefreshTokenRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct = default)
        => await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token, ct);

    public async Task<RefreshToken> AddAsync(RefreshToken refreshToken, CancellationToken ct = default)
    {
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(ct);
        return refreshToken;
    }

    public async Task RevokeAsync(string token, CancellationToken ct = default)
    {
        var rt = await GetByTokenAsync(token, ct);
        if (rt is null) return;
        rt.IsRevoked = true;
        _context.RefreshTokens.Update(rt);
        await _context.SaveChangesAsync(ct);
    }
}
