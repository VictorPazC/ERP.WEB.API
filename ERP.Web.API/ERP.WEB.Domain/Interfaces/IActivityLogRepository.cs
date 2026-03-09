using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface IActivityLogRepository
{
    Task<List<ActivityLog>> GetRecentAsync(int limit, CancellationToken ct = default);
    Task AddAsync(ActivityLog log, CancellationToken ct = default);
}
