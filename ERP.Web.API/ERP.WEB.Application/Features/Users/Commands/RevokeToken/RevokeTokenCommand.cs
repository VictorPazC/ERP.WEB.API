using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.RevokeToken;

public record RevokeTokenCommand(string Token) : IRequest<bool>;
