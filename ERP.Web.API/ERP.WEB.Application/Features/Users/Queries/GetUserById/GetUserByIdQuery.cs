using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Queries.GetUserById;

public record GetUserByIdQuery(int UserId) : IRequest<UserDto?>;
