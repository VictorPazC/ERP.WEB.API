using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.CreateUser;
using ERP.WEB.Application.Features.Users.Commands.DeleteUser;
using ERP.WEB.Application.Features.Users.Commands.Login;
using ERP.WEB.Application.Features.Users.Commands.UpdateUser;
using ERP.WEB.Application.Features.Users.Queries.GetAllUsers;
using ERP.WEB.Application.Features.Users.Queries.GetUserById;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

//[Authorize]
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
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll users requested");
        var users = await _mediator.Send(new GetAllUsersQuery());
        _logger.LogInformation("[INFO]  Returned {Count} users", users.Count());
        return Ok(users);
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

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        _logger.LogInformation("[INFO]  Creating user email={Email} role={Role}", dto.Email, dto.Role);
        var user = await _mediator.Send(new CreateUserCommand(dto));
        _logger.LogInformation("[INFO]  User created id={Id} email={Email}", user.UserId, user.Email);
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
    }

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

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
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
