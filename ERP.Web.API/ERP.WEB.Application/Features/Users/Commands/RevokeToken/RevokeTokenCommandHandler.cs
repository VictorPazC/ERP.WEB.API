using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.RevokeToken;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, bool>
{
    private readonly IRefreshTokenRepository _refreshTokenRepo;

    public RevokeTokenCommandHandler(IRefreshTokenRepository refreshTokenRepo)
    {
        _refreshTokenRepo = refreshTokenRepo;
    }

    public async ValueTask<bool> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var existing = await _refreshTokenRepo.GetByTokenAsync(request.Token, cancellationToken);
        if (existing is null || existing.IsRevoked) return false;

        await _refreshTokenRepo.RevokeAsync(request.Token, cancellationToken);
        return true;
    }
}
