using System.Net;
using System.Net.Http.Json;
using ERP.WEB.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ERP.Web.API.Tests.Tests;

/// <summary>
/// Tests for POST /api/users/seed-super-admin.
///
/// This class manages its OWN WebApplicationFactory + DB cleanup so it can
/// test the "first call → 201" path without depending on the shared ApiFixture
/// (which already seeds a SuperAdmin in its InitializeAsync).
///
/// Isolation from the [Collection("Api")] tests is guaranteed by
/// [assembly: CollectionBehavior(DisableTestParallelization = true)]
/// declared in GlobalUsings.cs — all test classes run sequentially.
/// </summary>
[Collection("Seed")]
public class SeedTests : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public SeedTests()
    {
        _factory = new WebApplicationFactory<Program>();
        _client  = _factory.CreateClient();
    }

    // ── IAsyncLifetime ────────────────────────────────────────────────────────

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await db.Database.MigrateAsync();

        // Wipe everything so the seed endpoint starts from a clean slate.
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

    public Task DisposeAsync()
    {
        _client.Dispose();
        return _factory.DisposeAsync().AsTask();
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SeedSuperAdmin_FirstCall_Returns201WithCorrectData()
    {
        // Act
        var resp = await _client.PostAsJsonAsync("/api/users/seed-super-admin", new
        {
            name     = "Test SuperAdmin",
            email    = "su@seed.test",
            password = "Admin1234!"
        });

        // Assert — HTTP 201
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        // Assert — body contains the created user
        var body = await resp.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(body);
        Assert.True(body!.UserId > 0,            "UserId must be > 0");
        Assert.Equal("su@seed.test", body.Email);
        Assert.Equal("SuperAdmin",   body.Role);
        Assert.Equal("Active",       body.Status);
    }

    [Fact]
    public async Task SeedSuperAdmin_SecondCall_Returns409Conflict()
    {
        // Arrange — first seed (expected to succeed)
        var first = await _client.PostAsJsonAsync("/api/users/seed-super-admin", new
        {
            name     = "Test SuperAdmin",
            email    = "su@seed.test",
            password = "Admin1234!"
        });
        first.EnsureSuccessStatusCode();

        // Act — second seed attempt (should be rejected)
        var second = await _client.PostAsJsonAsync("/api/users/seed-super-admin", new
        {
            name     = "Another Admin",
            email    = "other@seed.test",
            password = "Admin1234!"
        });

        // Assert — HTTP 409
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task SeedSuperAdmin_CanLoginAfterSeeding()
    {
        // Arrange — seed
        var seed = await _client.PostAsJsonAsync("/api/users/seed-super-admin", new
        {
            name     = "Test SuperAdmin",
            email    = "login.check@seed.test",
            password = "StrongPwd99!"
        });
        seed.EnsureSuccessStatusCode();

        // Act — login with seeded credentials
        var login = await _client.PostAsJsonAsync("/api/users/login", new
        {
            email    = "login.check@seed.test",
            password = "StrongPwd99!"
        });

        // Assert — HTTP 200 with token
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body!.Token), "JWT token must be present");
        Assert.True(body.IsSuperAdmin, "Seeded user must be SuperAdmin");
    }

    // ── Local response projections ────────────────────────────────────────────

    private record UserResponse(int UserId, string Email, string Role, string Status);
    private record LoginResponse(string Token, bool IsSuperAdmin);
}
