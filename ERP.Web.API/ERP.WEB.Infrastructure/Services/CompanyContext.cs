using ERP.WEB.Domain.Interfaces;

namespace ERP.WEB.Infrastructure.Services;

/// <summary>
/// Scoped service holding the current request's Company context.
/// Populated by TenantMiddleware from JWT claims.
/// </summary>
public class CompanyContext : ICompanyContext
{
    public int CompanyId { get; private set; }
    public bool IsSuperAdmin { get; private set; }

    public void Set(int companyId, bool isSuperAdmin)
    {
        CompanyId = companyId;
        IsSuperAdmin = isSuperAdmin;
    }
}
