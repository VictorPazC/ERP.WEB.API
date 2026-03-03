namespace ERP.WEB.Domain.Interfaces;

/// <summary>
/// Marker interface for entities scoped to a Company (multi-tenant row-level isolation).
/// </summary>
public interface ICompanyEntity
{
    int CompanyId { get; set; }
}
