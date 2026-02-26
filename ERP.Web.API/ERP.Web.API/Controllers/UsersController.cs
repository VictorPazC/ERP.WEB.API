using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Users.Commands.CreateUser;
using ERP.WEB.Application.Features.Users.Commands.DeleteUser;
using ERP.WEB.Application.Features.Users.Commands.Login;
using ERP.WEB.Application.Features.Users.Commands.UpdateUser;
using ERP.WEB.Application.Features.Users.Queries.GetAllUsers;
using ERP.WEB.Application.Features.Users.Queries.GetUserById;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.WEB.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _mediator.Send(new GetAllUsersQuery());
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var user = await _mediator.Send(new GetUserByIdQuery(id));
        if (user is null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        var user = await _mediator.Send(new CreateUserCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, user);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateUserDto dto)
    {
        if (id != dto.UserId) return BadRequest();
        var user = await _mediator.Send(new UpdateUserCommand(dto));
        if (user is null) return NotFound();
        return Ok(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResultDto>> Login([FromBody] LoginDto dto)
    {
        var result = await _mediator.Send(new LoginCommand(dto));
        if (result is null) return Unauthorized(new { message = "Email o contraseña incorrectos" });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteUserCommand(id));
        if (!result) return NotFound();
        return NoContent();
    }
}
