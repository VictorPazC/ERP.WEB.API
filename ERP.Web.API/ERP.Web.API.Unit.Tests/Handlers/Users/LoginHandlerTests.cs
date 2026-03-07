using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.Login;
using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Unit.Tests.Handlers.Users;

public class LoginHandlerTests
{
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly ICompanyRepository _companyRepo = Substitute.For<ICompanyRepository>();
    private readonly IRefreshTokenRepository _refreshTokenRepo = Substitute.For<IRefreshTokenRepository>();
    private readonly LoginCommandHandler _sut;

    public LoginHandlerTests()
    {
        _sut = new LoginCommandHandler(_userRepo, _tokenService, _companyRepo, _refreshTokenRepo);

        // Default token service stubs
        _tokenService.GenerateToken(Arg.Any<User>()).Returns("jwt-token");
        _tokenService.GenerateRefreshToken().Returns(("refresh-token", DateTime.UtcNow.AddDays(7)));
        _refreshTokenRepo.AddAsync(Arg.Any<RefreshToken>(), Arg.Any<CancellationToken>())
                         .Returns(c => Task.FromResult(c.Arg<RefreshToken>()));
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ReturnsNull()
    {
        _userRepo.GetByEmailAsync("missing@test.com").Returns(Task.FromResult<User?>(null));

        var result = await _sut.Handle(
            new LoginCommand(new LoginDto("missing@test.com", "pass")), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenPasswordWrong_ReturnsNull()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("correct-password");
        var user = new User { UserId = 1, Name = "Test", Email = "u@test.com", Role = "Admin", PasswordHash = hash };

        _userRepo.GetByEmailAsync("u@test.com").Returns(Task.FromResult<User?>(user));

        var result = await _sut.Handle(
            new LoginCommand(new LoginDto("u@test.com", "wrong-password")), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenValid_ReturnsLoginResultWithTokens()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("secret");
        var user = new User { UserId = 10, Name = "Alice", Email = "alice@test.com", Role = "Admin",
                              PasswordHash = hash, CompanyId = 1 };

        _userRepo.GetByEmailAsync("alice@test.com").Returns(Task.FromResult<User?>(user));
        _companyRepo.GetByIdAsync(1).Returns(Task.FromResult<Company?>(
            new Company { CompanyId = 1, Name = "Acme" }));

        var result = await _sut.Handle(
            new LoginCommand(new LoginDto("alice@test.com", "secret")), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Token.Should().Be("jwt-token");
        result.RefreshToken.Should().Be("refresh-token");
        result.UserId.Should().Be(10);
        result.Name.Should().Be("Alice");
        result.CompanyName.Should().Be("Acme");
    }

    [Fact]
    public async Task Handle_SuperAdmin_IncludesCompaniesList()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("admin");
        var user = new User { UserId = 1, Name = "Root", Email = "root@test.com", Role = "SuperAdmin",
                              PasswordHash = hash, IsSuperAdmin = true, CompanyId = null };

        _userRepo.GetByEmailAsync("root@test.com").Returns(Task.FromResult<User?>(user));
        _companyRepo.GetAllAsync(Arg.Any<CursorParams>(), Arg.Any<CancellationToken>())
                    .Returns(Task.FromResult(new List<Company>
                    {
                        new() { CompanyId = 1, Name = "Acme", Slug = "acme", IsActive = true },
                        new() { CompanyId = 2, Name = "Globex", Slug = "globex", IsActive = true },
                    }));

        var result = await _sut.Handle(
            new LoginCommand(new LoginDto("root@test.com", "admin")), CancellationToken.None);

        result!.Companies.Should().NotBeNull();
        result.Companies!.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_RegularUser_CompaniesListIsNull()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("pass");
        var user = new User { UserId = 2, Name = "Bob", Email = "bob@test.com", Role = "Viewer",
                              PasswordHash = hash, CompanyId = 1, IsSuperAdmin = false };

        _userRepo.GetByEmailAsync("bob@test.com").Returns(Task.FromResult<User?>(user));
        _companyRepo.GetByIdAsync(1).Returns(Task.FromResult<Company?>(
            new Company { CompanyId = 1, Name = "Acme" }));

        var result = await _sut.Handle(
            new LoginCommand(new LoginDto("bob@test.com", "pass")), CancellationToken.None);

        result!.Companies.Should().BeNull();
    }
}
