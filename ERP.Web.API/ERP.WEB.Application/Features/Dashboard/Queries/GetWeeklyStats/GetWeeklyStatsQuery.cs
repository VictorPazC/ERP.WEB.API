using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetWeeklyStats;

public record GetWeeklyStatsQuery(int Days = 7) : IRequest<IEnumerable<WeeklyStatDto>>;
