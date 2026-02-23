using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Inventory.Commands.CreateInventory;
using ERP.WEB.Application.Features.Inventory.Commands.DeleteInventory;
using ERP.WEB.Application.Features.Inventory.Commands.UpdateInventory;
using ERP.WEB.Application.Features.Inventory.Queries.GetAllInventory;
using ERP.WEB.Application.Features.Inventory.Queries.GetInventoryById;
using ERP.WEB.Application.Features.Inventory.Queries.GetInventoryByProductId;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public InventoryController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryDto>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllInventoryQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InventoryDto>> GetById(int id)
    {
        var result = await _mediator.Send(new GetInventoryByIdQuery(id));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<InventoryDto>> GetByProductId(int productId)
    {
        var result = await _mediator.Send(new GetInventoryByProductIdQuery(productId));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<InventoryDto>> Create([FromBody] CreateInventoryDto dto)
    {
        var result = await _mediator.Send(new CreateInventoryCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.InventoryId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InventoryDto>> Update(int id, [FromBody] UpdateInventoryDto dto)
    {
        if (id != dto.InventoryId)
            return BadRequest();

        var result = await _mediator.Send(new UpdateInventoryCommand(dto));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteInventoryCommand(id));

        if (!result)
            return NotFound();

        return NoContent();
    }
}
