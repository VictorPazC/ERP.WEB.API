using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Queries.GetAllUsers;

public record GetAllUsersQuery(CursorParams Params) : IRequest<CursorPagedResult<UserDto>>;
