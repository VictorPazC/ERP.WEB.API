using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.DeleteUser;

public record DeleteUserCommand(int UserId) : IRequest<bool>;
