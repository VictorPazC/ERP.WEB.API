using System.Net.Http.Headers;
using System.Net.Http.Json;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ERP.Web.API.Tests.Infrastructure;

// ── Collection definition ─────────────────────────────────────────────────────
// All classes with [Collection("Api")] share ONE ApiFixture instance
// and are serialized (run one at a time) by xunit.
[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<ApiFixture> { }

/// <summary>
/// Shared integration-test fixture.
/// Spins up the real API via WebApplicationFactory&lt;Program&gt;, applies
/// pending EF migrations, wipes the erptest DB, and seeds:
///   • 1 SuperAdmin (no company)
///   • 2 companies  : Acme Corp, Globex Corp
///   • 2 admin users: acme.admin / globex.admin  (one per company)
/// </summary>
public class ApiFixture : IAsyncLifetime
{
    public WebApplicationFactory<Program> Factory { get; }

    /// <summary>Unauthenticated client — for public endpoints (login, seed).</summary>
    public HttpClient AnonClient { get; }

    // Seeded principals — populated during InitializeAsync
    public LoginResultDto SuperAdmin  { get; private set; } = null!;
    public CompanyDto     AcmeCorp    { get; private set; } = null!;
    public CompanyDto     GlobexCorp  { get; private set; } = null!;
    public LoginResultDto AcmeAdmin   { get; private set; } = null!;
    public LoginResultDto GlobexAdmin { get; private set; } = null!;

    public ApiFixture()
    {
        Factory    = new WebApplicationFactory<Program>();
        AnonClient = Factory.CreateClient();
    }

    // ── IAsyncLifetime ────────────────────────────────────────────────────────

    public async Task InitializeAsync()
    {
        // 1. Apply any pending EF migrations + wipe existing data
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.MigrateAsync();
            await WipeAllAsync(db);
        }

        // 2. Seed SuperAdmin via the public [AllowAnonymous] endpoint
        var seedResp = await AnonClient.PostAsJsonAsync("/api/users/seed-super-admin", new
        {
            name     = "Super Admin",
            email    = "superadmin@erptest.dev",
            password = "Admin1234!"
        });
        seedResp.EnsureSuccessStatusCode();

        // 3. Login as SuperAdmin
        SuperAdmin = await LoginAsync("superadmin@erptest.dev", "Admin1234!");

        // 4. Create two companies (SuperAdmin has no tenant scope → no X-Company-Id needed)
        AcmeCorp   = await CreateCompanyAsync(SuperAdmin.Token, "Acme Corp",   "acme");
        GlobexCorp = await CreateCompanyAsync(SuperAdmin.Token, "Globex Corp", "globex");

        // 5. Create one Admin user per company
        //    SuperAdmin passes X-Company-Id so CreateUserCommandHandler
        //    assigns CompanyId from ICompanyContext.
        await CreateUserAsync(SuperAdmin.Token, AcmeCorp.CompanyId,
            "Acme Admin", "acme.admin@erptest.dev", "Admin", "Admin1234!");
        await CreateUserAsync(SuperAdmin.Token, GlobexCorp.CompanyId,
            "Globex Admin", "globex.admin@erptest.dev", "Admin", "Admin1234!");

        // 6. Login as each company admin
        AcmeAdmin   = await LoginAsync("acme.admin@erptest.dev",   "Admin1234!", AcmeCorp.CompanyId);
        GlobexAdmin = await LoginAsync("globex.admin@erptest.dev", "Admin1234!", GlobexCorp.CompanyId);
    }

    public Task DisposeAsync()
    {
        AnonClient.Dispose();
        return Factory.DisposeAsync().AsTask();
    }

    // ── Public helpers ────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a pre-authenticated HttpClient for the given login session.
    /// Optionally sets X-Company-Id for tenant-scoped requests.
    /// </summary>
    public HttpClient CreateAuthClient(LoginResultDto login, int companyId = 0)
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", login.Token);

        if (companyId > 0)
            client.DefaultRequestHeaders.Add("X-Company-Id", companyId.ToString());

        return client;
    }

    /// <summary>Calls POST /api/users/login and returns the deserialized result.</summary>
    public async Task<LoginResultDto> LoginAsync(string email, string password, int companyId = 0)
    {
        var msg = new HttpRequestMessage(HttpMethod.Post, "/api/users/login")
        {
            Content = JsonContent.Create(new { email, password })
        };

        if (companyId > 0)
            msg.Headers.Add("X-Company-Id", companyId.ToString());

        var resp = await AnonClient.SendAsync(msg);
        resp.EnsureSuccessStatusCode();

        return (await resp.Content.ReadFromJsonAsync<LoginResultDto>())!;
    }

    // ── Private seed helpers ──────────────────────────────────────────────────

    /// <summary>
    /// Deletes all rows in reverse FK order using raw SQL
    /// to avoid EF query-filter interference and SaveChanges ordering issues.
    /// </summary>
    private static async Task WipeAllAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("DELETE FROM RefreshTokens");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM OrderItems");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Orders");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Consumptions");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Promotions");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Product_Images");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Inventory");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM ProductVariants");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Product_Tags");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Products");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Categories");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Brands");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Tags");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Users");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM Companies");
    }

    private async Task<CompanyDto> CreateCompanyAsync(string token, string name, string slug)
    {
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var resp = await client.PostAsJsonAsync("/api/companies", new { name, slug });
        resp.EnsureSuccessStatusCode();

        return (await resp.Content.ReadFromJsonAsync<CompanyDto>())!;
    }

    private async Task CreateUserAsync(
        string token, int companyId,
        string name, string email, string role, string password)
    {
        using var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("X-Company-Id", companyId.ToString());

        var resp = await client.PostAsJsonAsync("/api/users", new { name, email, role, password });
        resp.EnsureSuccessStatusCode();
    }
}
