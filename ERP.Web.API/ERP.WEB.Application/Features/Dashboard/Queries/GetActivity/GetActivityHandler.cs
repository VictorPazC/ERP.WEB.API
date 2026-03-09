using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Dashboard.Queries.GetActivity;

public class GetActivityHandler : IRequestHandler<GetActivityQuery, IEnumerable<ActivityLogDto>>
{
    private readonly IActivityLogRepository _repo;

    public GetActivityHandler(IActivityLogRepository repo) => _repo = repo;

    public async ValueTask<IEnumerable<ActivityLogDto>> Handle(
        GetActivityQuery request, CancellationToken ct)
    {
        var logs = await _repo.GetRecentAsync(request.Limit, ct);
        return logs.Select(l => new ActivityLogDto(
            l.ActivityLogId, l.Type, l.Title, l.Description, l.Amount, l.Timestamp));
    }
}
