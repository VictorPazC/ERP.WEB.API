using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using ERP.WEB.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.WEB.Infrastructure.Repositories;

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityLogRepository(ApplicationDbContext context) => _context = context;

    public async Task<List<ActivityLog>> GetRecentAsync(int limit, CancellationToken ct = default)
        => await _context.ActivityLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .ToListAsync(ct);

    public async Task AddAsync(ActivityLog log, CancellationToken ct = default)
    {
        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync(ct);
    }
}
