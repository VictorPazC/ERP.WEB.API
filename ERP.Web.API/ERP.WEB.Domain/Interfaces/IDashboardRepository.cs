using ERP.WEB.Domain.Common;

namespace ERP.WEB.Domain.Interfaces;

public interface IDashboardRepository
{
    Task<List<WeeklyStatResult>> GetWeeklyStatsAsync(int days, CancellationToken ct = default);
    Task<List<TopProductResult>> GetTopProductsAsync(int limit, string metric, CancellationToken ct = default);
}
