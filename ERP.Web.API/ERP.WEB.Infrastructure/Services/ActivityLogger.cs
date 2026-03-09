using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Infrastructure.Services;

public class ActivityLogger : IActivityLogger
{
    private readonly IActivityLogRepository _repo;
    private readonly ICompanyContext _companyContext;

    public ActivityLogger(IActivityLogRepository repo, ICompanyContext companyContext)
    {
        _repo = repo;
        _companyContext = companyContext;
    }

    public async Task LogAsync(
        string type,
        string title,
        string? description = null,
        decimal? amount = null,
        CancellationToken ct = default)
    {
        var log = new ActivityLog
        {
            CompanyId   = _companyContext.CompanyId > 0 ? _companyContext.CompanyId : null,
            Type        = type,
            Title       = title,
            Description = description,
            Amount      = amount,
            Timestamp   = DateTime.UtcNow
        };

        await _repo.AddAsync(log, ct);
    }
}
