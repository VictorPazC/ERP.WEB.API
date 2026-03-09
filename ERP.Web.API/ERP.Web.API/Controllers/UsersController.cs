using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.CreateUser;
using ERP.WEB.Application.Features.Users.Commands.DeleteUser;
using ERP.WEB.Application.Features.Users.Commands.Login;
using ERP.WEB.Application.Features.Users.Commands.RefreshToken;
using ERP.WEB.Application.Features.Users.Commands.RevokeToken;
using ERP.WEB.Application.Features.Users.Commands.SeedSuperAdmin;
using ERP.WEB.Application.Features.Users.Commands.UpdateUser;
using ERP.WEB.Application.Features.Users.Queries.GetAllUsers;
using ERP.WEB.Application.Features.Users.Queries.GetUserById;
using ERP.Web.API.Authorization;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

public record RefreshTokenRequest(string Token);
public record RevokeTokenRequest(string Token);

// Protege todos los endpoints de usuarios. Login y Refresh quedan públicos vía [AllowAnonymous].
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IMediator mediator, ILogger<UsersController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<CursorPagedResult<UserDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetAll users cursor={Cursor} pageSize={PageSize}", cursor, pageSize);
        var result = await _mediator.Send(new GetAllUsersQuery(new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} users hasMore={HasMore}", result.Items.Count(), result.HasMore);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById user id={Id}", id);
        var user = await _mediator.Send(new GetUserByIdQuery(id));
        if (user is null)
        {
            _logger.LogWarning("[WARN]  User id={Id} not found", id);
            return NotFound();
        }
        _logger.LogInformation("[INFO]  Returned user id={Id} email={Email}", id, user.Email);
        return Ok(user);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        _logger.LogInformation("[INFO]  Creating user email={Email} role={Role}", dto.Email, dto.Role);
        var user = await _mediator.Send(new CreateUserCommand(dto));
        _logger.LogInformation("[INFO]  User created id={Id} email={Email}", user.UserId, user.Email);
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateUserDto dto)
    {
        if (id != dto.UserId)
        {
            _logger.LogWarning("[WARN]  Update user id mismatch: route={RouteId} body={BodyId}", id, dto.UserId);
            return BadRequest();
        }
        _logger.LogInformation("[INFO]  Updating user id={Id}", id);
        var user = await _mediator.Send(new UpdateUserCommand(dto));
        if (user is null)
        {
            _logger.LogWarning("[WARN]  User id={Id} not found for update", id);
            return NotFound();
        }
        _logger.LogInformation("[INFO]  User id={Id} updated successfully", id);
        return Ok(user);
    }

    /// <summary>
    /// Crea el primer SuperAdmin del sistema. Devuelve 409 Conflict si ya existe uno.
    /// Este endpoint no requiere autenticación y sólo puede ejecutarse una vez.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("seed-super-admin")]
    public async Task<ActionResult<UserDto>> SeedSuperAdmin([FromBody] SeedSuperAdminDto dto)
    {
        _logger.LogInformation("[INFO]  SeedSuperAdmin attempt for email={Email}", dto.Email);
        var user = await _mediator.Send(new SeedSuperAdminCommand(dto));
        if (user is null)
        {
            _logger.LogWarning("[WARN]  SeedSuperAdmin rejected — SuperAdmin already exists");
            return Conflict(new { message = "A SuperAdmin already exists. Use the normal login." });
        }
        _logger.LogInformation("[INFO]  SuperAdmin seeded id={Id} email={Email}", user.UserId, user.Email);
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResultDto>> Login([FromBody] LoginDto dto)
    {
        _logger.LogInformation("[INFO]  Login attempt for email={Email}", dto.Email);
        var result = await _mediator.Send(new LoginCommand(dto));
        if (result is null)
        {
            _logger.LogWarning("[WARN]  Login failed for email={Email} — invalid credentials", dto.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }
        _logger.LogInformation("[INFO]  Login successful for email={Email} userId={UserId} role={Role}",
            dto.Email, result.UserId, result.Role);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResultDto>> Refresh([FromBody] RefreshTokenRequest req)
    {
        _logger.LogInformation("[INFO]  Token refresh requested");
        var result = await _mediator.Send(new RefreshTokenCommand(req.Token));
        if (result is null)
        {
            _logger.LogWarning("[WARN]  Token refresh failed — invalid or expired token");
            return Unauthorized(new { message = "Invalid or expired refresh token" });
        }
        _logger.LogInformation("[INFO]  Token refresh successful for userId={UserId}", result.UserId);
        return Ok(result);
    }

    [HttpPost("revoke")]
    public async Task<ActionResult> Revoke([FromBody] RevokeTokenRequest req)
    {
        _logger.LogInformation("[INFO]  Token revoke requested");
        var result = await _mediator.Send(new RevokeTokenCommand(req.Token));
        if (!result)
        {
            _logger.LogWarning("[WARN]  Token revoke failed — token not found or already revoked");
            return NotFound(new { message = "Token not found or already revoked" });
        }
        _logger.LogInformation("[INFO]  Token revoked successfully");
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        // Impide que un usuario se elimine a sí mismo
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        if (id == currentUserId)
        {
            _logger.LogWarning("[WARN]  User id={Id} attempted self-deletion", id);
            return BadRequest(new { message = "No puedes eliminar tu propia cuenta." });
        }

        _logger.LogInformation("[INFO]  Deleting user id={Id}", id);
        var result = await _mediator.Send(new DeleteUserCommand(id));
        if (!result)
        {
            _logger.LogWarning("[WARN]  User id={Id} not found for deletion", id);
            return NotFound();
        }
        _logger.LogInformation("[INFO]  User id={Id} deleted", id);
        return NoContent();
    }
}
