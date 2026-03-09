using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetActivity;

public record GetActivityQuery(int Limit = 10) : IRequest<IEnumerable<ActivityLogDto>>;
