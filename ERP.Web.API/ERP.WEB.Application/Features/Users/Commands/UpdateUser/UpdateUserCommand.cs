using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(UpdateUserDto UserDto) : IRequest<UserDto?>;
