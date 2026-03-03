using System.Security.Claims;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Middleware;

/// <summary>
/// Reads JWT claims and populates ICompanyContext for the current request.
/// SuperAdmin can override company via X-Company-Id header.
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICompanyContext companyContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var isSuperAdmin = context.User.FindFirst("isSuperAdmin")?.Value == "true";
            var companyIdClaim = context.User.FindFirst("companyId")?.Value;

            var companyId = 0;
            if (int.TryParse(companyIdClaim, out var claimCompanyId))
                companyId = claimCompanyId;

            // SuperAdmin can switch company via header
            if (isSuperAdmin && context.Request.Headers.TryGetValue("X-Company-Id", out var headerVal))
            {
                if (int.TryParse(headerVal.FirstOrDefault(), out var headerCompanyId) && headerCompanyId > 0)
                    companyId = headerCompanyId;
            }

            companyContext.Set(companyId, isSuperAdmin);
        }

        await _next(context);
    }
}

public static class TenantMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantMiddleware>();
    }
}
