using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.RefreshToken;

public record RefreshTokenCommand(string Token) : IRequest<LoginResultDto?>;
