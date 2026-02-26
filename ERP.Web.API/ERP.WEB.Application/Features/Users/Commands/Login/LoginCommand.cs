using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.Login;

public record LoginCommand(LoginDto LoginDto) : IRequest<LoginResultDto?>;
