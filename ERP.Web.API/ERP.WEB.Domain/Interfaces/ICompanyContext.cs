namespace ERP.WEB.Domain.Interfaces;

/// <summary>
/// Scoped service that holds the current request's Company context.
/// Populated by TenantMiddleware from JWT claims.
/// </summary>
public interface ICompanyContext
{
    int CompanyId { get; }
    bool IsSuperAdmin { get; }
    void Set(int companyId, bool isSuperAdmin);
}
