using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.SeedSuperAdmin;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Unit.Tests.Handlers.Users;

public class SeedSuperAdminHandlerTests
{
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly SeedSuperAdminCommandHandler _sut;

    public SeedSuperAdminHandlerTests()
    {
        _sut = new SeedSuperAdminCommandHandler(_userRepo);
    }

    [Fact]
    public async Task Handle_WhenSuperAdminExists_ReturnsNull()
    {
        _userRepo.AnySuperAdminAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));

        var result = await _sut.Handle(
            new SeedSuperAdminCommand(new SeedSuperAdminDto("Root", "root@test.com", "pass")),
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenNone_CreatesAndReturnsUserDto()
    {
        _userRepo.AnySuperAdminAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));
        _userRepo.AddAsync(Arg.Any<User>()).Returns(c =>
        {
            var u = c.Arg<User>();
            u.UserId = 1;
            u.Status = "Active";
            u.CreatedAt = DateTime.UtcNow;
            return Task.FromResult(u);
        });

        var result = await _sut.Handle(
            new SeedSuperAdminCommand(new SeedSuperAdminDto("Root", "root@test.com", "secret")),
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Root");
        result.Email.Should().Be("root@test.com");
        result.UserId.Should().Be(1);
    }

    [Fact]
    public async Task Handle_NewUser_HasSuperAdminRoleAndFlag()
    {
        _userRepo.AnySuperAdminAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));

        User? captured = null;
        _userRepo.AddAsync(Arg.Any<User>()).Returns(c =>
        {
            captured = c.Arg<User>();
            captured.UserId = 99;
            captured.Status = "Active";
            captured.CreatedAt = DateTime.UtcNow;
            return Task.FromResult(captured);
        });

        await _sut.Handle(
            new SeedSuperAdminCommand(new SeedSuperAdminDto("Root", "root@test.com", "secret")),
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Role.Should().Be("SuperAdmin");
        captured.IsSuperAdmin.Should().BeTrue();
    }
}
