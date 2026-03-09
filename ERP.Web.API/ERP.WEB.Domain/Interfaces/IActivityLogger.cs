namespace ERP.WEB.Domain.Interfaces;

public interface IActivityLogger
{
    Task LogAsync(
        string type,
        string title,
        string? description = null,
        decimal? amount = null,
        CancellationToken ct = default);
}
