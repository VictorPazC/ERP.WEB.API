using System.Globalization;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetWeeklyStats;

public class GetWeeklyStatsHandler : IRequestHandler<GetWeeklyStatsQuery, IEnumerable<WeeklyStatDto>>
{
    private readonly IDashboardRepository _repo;

    public GetWeeklyStatsHandler(IDashboardRepository repo) => _repo = repo;

    public async ValueTask<IEnumerable<WeeklyStatDto>> Handle(
        GetWeeklyStatsQuery request, CancellationToken ct)
    {
        var rawStats = await _repo.GetWeeklyStatsAsync(request.Days, ct);

        // Build a complete range of days, filling zeros for days without data
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(request.Days - 1));
        var statsByDay = rawStats.ToDictionary(s => s.Day.Date);

        var culture = new CultureInfo("es-MX");
        var result = new List<WeeklyStatDto>();

        for (var d = startDate; d <= today; d = d.AddDays(1))
        {
            var dayName = d.ToString("ddd", culture);
            if (statsByDay.TryGetValue(d, out var stat))
                result.Add(new WeeklyStatDto(dayName, stat.Ganancia, stat.Pedidos));
            else
                result.Add(new WeeklyStatDto(dayName, 0m, 0));
        }

        return result;
    }
}
