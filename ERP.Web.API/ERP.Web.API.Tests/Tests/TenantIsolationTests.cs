using System.Net;
using System.Net.Http.Json;
using ERP.Web.API.Tests.Infrastructure;
using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;

namespace ERP.Web.API.Tests.Tests;

/// <summary>
/// Verifies row-level multi-tenant isolation enforced by the EF global query
/// filters and TenantMiddleware.
///
/// Relies on the shared ApiFixture which seeds:
///   SuperAdmin  — no company scope
///   AcmeCorp    — CompanyId seeded by fixture
///   GlobexCorp  — CompanyId seeded by fixture
///   AcmeAdmin   — Admin user for AcmeCorp
///   GlobexAdmin — Admin user for GlobexCorp
/// </summary>
[Collection("Api")]
public class TenantIsolationTests
{
    private readonly ApiFixture _fx;

    public TenantIsolationTests(ApiFixture fx) => _fx = fx;

    // ── Brand isolation ───────────────────────────────────────────────────────

    [Fact]
    public async Task Brands_EachAdminOnlySeesOwnCompanyBrands()
    {
        // Use unique suffixes so parallel runs of the same test don't bleed into each other.
        var suffix = Guid.NewGuid().ToString("N")[..8];

        using var acme   = _fx.CreateAuthClient(_fx.AcmeAdmin,   _fx.AcmeCorp.CompanyId);
        using var globex = _fx.CreateAuthClient(_fx.GlobexAdmin, _fx.GlobexCorp.CompanyId);

        // Create one brand per company
        var acmeBrandResp = await acme.PostAsJsonAsync("/api/brands",
            new { name = $"Acme-Brand-{suffix}", description = (string?)null });
        acmeBrandResp.EnsureSuccessStatusCode();

        var globexBrandResp = await globex.PostAsJsonAsync("/api/brands",
            new { name = $"Globex-Brand-{suffix}", description = (string?)null });
        globexBrandResp.EnsureSuccessStatusCode();

        // Each admin fetches their brand list
        var acmeResult   = await acme  .GetFromJsonAsync<CursorPagedResult<BrandDto>>("/api/brands");
        var globexResult = await globex.GetFromJsonAsync<CursorPagedResult<BrandDto>>("/api/brands");

        Assert.NotNull(acmeResult);
        Assert.NotNull(globexResult);

        var acmeNames   = acmeResult!  .Items.Select(b => b.Name).ToList();
        var globexNames = globexResult!.Items.Select(b => b.Name).ToList();

        // Acme sees its own brand
        Assert.Contains($"Acme-Brand-{suffix}", acmeNames);

        // Acme does NOT see Globex's brand
        Assert.DoesNotContain($"Globex-Brand-{suffix}", acmeNames);

        // Globex sees its own brand
        Assert.Contains($"Globex-Brand-{suffix}", globexNames);

        // Globex does NOT see Acme's brand
        Assert.DoesNotContain($"Acme-Brand-{suffix}", globexNames);
    }

    [Fact]
    public async Task Brands_SuperAdminSeesAllCompanyBrands()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];

        using var acme       = _fx.CreateAuthClient(_fx.AcmeAdmin,   _fx.AcmeCorp.CompanyId);
        using var globex     = _fx.CreateAuthClient(_fx.GlobexAdmin, _fx.GlobexCorp.CompanyId);
        using var superAdmin = _fx.CreateAuthClient(_fx.SuperAdmin);  // no X-Company-Id

        // Create one brand per company
        (await acme  .PostAsJsonAsync("/api/brands", new { name = $"Acme-SA-{suffix}"   })).EnsureSuccessStatusCode();
        (await globex.PostAsJsonAsync("/api/brands", new { name = $"Globex-SA-{suffix}" })).EnsureSuccessStatusCode();

        // SuperAdmin fetches brands — IsSuperAdmin bypasses row-level filter
        var result = await superAdmin.GetFromJsonAsync<CursorPagedResult<BrandDto>>("/api/brands");
        Assert.NotNull(result);

        var names = result!.Items.Select(b => b.Name).ToList();
        Assert.Contains($"Acme-SA-{suffix}",   names);
        Assert.Contains($"Globex-SA-{suffix}", names);
    }

    // ── User isolation ────────────────────────────────────────────────────────

    [Fact]
    public async Task Users_EachAdminOnlySeesOwnCompanyUsers()
    {
        using var acme   = _fx.CreateAuthClient(_fx.AcmeAdmin,   _fx.AcmeCorp.CompanyId);
        using var globex = _fx.CreateAuthClient(_fx.GlobexAdmin, _fx.GlobexCorp.CompanyId);

        var acmeResult   = await acme  .GetFromJsonAsync<CursorPagedResult<UserDto>>("/api/users");
        var globexResult = await globex.GetFromJsonAsync<CursorPagedResult<UserDto>>("/api/users");

        Assert.NotNull(acmeResult);
        Assert.NotNull(globexResult);

        var acmeEmails   = acmeResult!  .Items.Select(u => u.Email).ToList();
        var globexEmails = globexResult!.Items.Select(u => u.Email).ToList();

        // Each admin can see themselves
        Assert.Contains("acme.admin@erptest.dev",   acmeEmails);
        Assert.Contains("globex.admin@erptest.dev", globexEmails);

        // Cross-tenant isolation — each admin must NOT see the other tenant's users
        Assert.DoesNotContain("globex.admin@erptest.dev", acmeEmails);
        Assert.DoesNotContain("acme.admin@erptest.dev",   globexEmails);

        // SuperAdmin (CompanyId=NULL) must NOT appear in company-scoped user lists
        Assert.DoesNotContain("superadmin@erptest.dev", acmeEmails);
        Assert.DoesNotContain("superadmin@erptest.dev", globexEmails);
    }

    [Fact]
    public async Task Users_SuperAdminSeesAllUsers()
    {
        using var superAdmin = _fx.CreateAuthClient(_fx.SuperAdmin);

        var result = await superAdmin.GetFromJsonAsync<CursorPagedResult<UserDto>>("/api/users");
        Assert.NotNull(result);

        var emails = result!.Items.Select(u => u.Email).ToList();

        Assert.Contains("superadmin@erptest.dev",     emails);
        Assert.Contains("acme.admin@erptest.dev",     emails);
        Assert.Contains("globex.admin@erptest.dev",   emails);
    }

    // ── Auth guards ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Brands_UnauthenticatedRequest_Returns401()
    {
        var resp = await _fx.AnonClient.GetAsync("/api/brands");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401()
    {
        var resp = await _fx.AnonClient.PostAsJsonAsync("/api/users/login", new
        {
            email    = "nobody@nowhere.dev",
            password = "wrongpassword!"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokenAndRefreshToken()
    {
        var resp = await _fx.AnonClient.PostAsJsonAsync("/api/users/login", new
        {
            email    = "acme.admin@erptest.dev",
            password = "Admin1234!"
        });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<LoginResultDto>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body!.Token),        "JWT token must be present");
        Assert.False(string.IsNullOrEmpty(body.RefreshToken),  "Refresh token must be present");
        Assert.Equal("acme.admin@erptest.dev", body.Email);
        Assert.Equal("Admin", body.Role);
        Assert.False(body.IsSuperAdmin);
        Assert.Equal(_fx.AcmeCorp.CompanyId, body.CompanyId);
    }

    // ── Viewer role — read-only access ────────────────────────────────────────

    [Fact]
    public async Task Brands_ViewerRoleCanRead_ButCannotCreate()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];

        // Create a Viewer user under AcmeCorp (as AcmeAdmin)
        using var acmeAdmin = _fx.CreateAuthClient(_fx.AcmeAdmin, _fx.AcmeCorp.CompanyId);
        var createResp = await acmeAdmin.PostAsJsonAsync("/api/users", new
        {
            name     = "Acme Viewer",
            email    = $"viewer.{suffix}@erptest.dev",
            role     = "Viewer",
            password = "Viewer1234!"
        });
        createResp.EnsureSuccessStatusCode();

        // Login as the Viewer
        var viewerLogin = await _fx.LoginAsync(
            $"viewer.{suffix}@erptest.dev", "Viewer1234!", _fx.AcmeCorp.CompanyId);

        using var viewerClient = _fx.CreateAuthClient(viewerLogin, _fx.AcmeCorp.CompanyId);

        // GET /api/brands → should succeed (Viewer policy allows all authenticated roles)
        var getResp = await viewerClient.GetAsync("/api/brands");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        // POST /api/brands → should be forbidden (Admin policy required)
        var postResp = await viewerClient.PostAsJsonAsync("/api/brands",
            new { name = $"Viewer-Brand-{suffix}" });
        Assert.Equal(HttpStatusCode.Forbidden, postResp.StatusCode);
    }
}
