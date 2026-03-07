using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.Login;
using ERP.WEB.Application.Features.Users.Commands.SeedSuperAdmin;
using ERP.Web.API.Controllers;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ERP.Web.API.Unit.Tests.Controllers;

public class UsersControllerTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly ILogger<UsersController> _logger = Substitute.For<ILogger<UsersController>>();
    private readonly UsersController _sut;

    public UsersControllerTests()
    {
        _sut = new UsersController(_mediator, _logger);
    }

    // ── SeedSuperAdmin ───────────────────────────────────────────────────────

    [Fact]
    public async Task SeedSuperAdmin_WhenCreated_Returns201()
    {
        var userDto = new UserDto(1, "Root", "root@test.com", "SuperAdmin", "Active", DateTime.UtcNow);
        _mediator.Send(Arg.Any<SeedSuperAdminCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<UserDto?>(userDto));

        var action = await _sut.SeedSuperAdmin(new SeedSuperAdminDto("Root", "root@test.com", "pass"));

        var created = action.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.StatusCode.Should().Be(201);
        created.Value.Should().Be(userDto);
    }

    [Fact]
    public async Task SeedSuperAdmin_WhenAlreadyExists_Returns409()
    {
        _mediator.Send(Arg.Any<SeedSuperAdminCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<UserDto?>((UserDto?)null));

        var action = await _sut.SeedSuperAdmin(new SeedSuperAdminDto("Root", "root@test.com", "pass"));

        action.Result.Should().BeOfType<ConflictObjectResult>();
    }

    // ── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WhenValid_Returns200()
    {
        var loginResult = new LoginResultDto("jwt", 1, "Alice", "a@test.com", "Admin",
            1, "Acme", false, null, "refresh", DateTime.UtcNow.AddDays(7));

        _mediator.Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<LoginResultDto?>(loginResult));

        var action = await _sut.Login(new LoginDto("a@test.com", "pass"));

        var ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(loginResult);
    }

    [Fact]
    public async Task Login_WhenInvalid_Returns401()
    {
        _mediator.Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<LoginResultDto?>((LoginResultDto?)null));

        var action = await _sut.Login(new LoginDto("bad@test.com", "wrong"));

        action.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
