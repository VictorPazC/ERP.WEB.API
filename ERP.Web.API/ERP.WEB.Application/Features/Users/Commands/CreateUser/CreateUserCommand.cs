using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(CreateUserDto UserDto) : IRequest<UserDto>;
