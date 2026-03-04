using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Inventory.Commands.CreateInventory;
using ERP.WEB.Application.Features.Inventory.Commands.DeleteInventory;
using ERP.WEB.Application.Features.Inventory.Commands.RestockInventory;
using ERP.WEB.Application.Features.Inventory.Commands.UpdateInventory;
using ERP.WEB.Application.Features.Inventory.Queries.GetAllInventory;
using ERP.WEB.Application.Features.Inventory.Queries.GetInventoryById;
using ERP.WEB.Application.Features.Inventory.Queries.GetInventoryByProductId;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using ERP.Web.API.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(IMediator mediator, ILogger<InventoryController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<CursorPagedResult<InventoryDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetAll inventory cursor={Cursor} pageSize={PageSize}", cursor, pageSize);
        var result = await _mediator.Send(new GetAllInventoryQuery(new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} inventory records hasMore={HasMore}", result.Items.Count(), result.HasMore);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InventoryDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById inventory id={Id}", id);
        var result = await _mediator.Send(new GetInventoryByIdQuery(id));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Inventory id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned inventory id={Id} product={Product}", id, result.ProductName);
        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<InventoryDto>> GetByProductId(int productId)
    {
        _logger.LogDebug("[DEBUG] GetByProductId inventory productId={ProductId}", productId);
        var result = await _mediator.Send(new GetInventoryByProductIdQuery(productId));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Inventory for productId={ProductId} not found", productId);
            return NotFound();
        }

        return Ok(result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<InventoryDto>> Create([FromBody] CreateInventoryDto dto)
    {
        _logger.LogInformation("[INFO]  Creating inventory for productId={ProductId} stock={Stock}", dto.ProductId, dto.CurrentStock);
        var result = await _mediator.Send(new CreateInventoryCommand(dto));
        _logger.LogInformation("[INFO]  Inventory created id={Id} for productId={ProductId}", result.InventoryId, result.ProductId);
        return CreatedAtAction(nameof(GetById), new { id = result.InventoryId }, result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult<InventoryDto>> Update(int id, [FromBody] UpdateInventoryDto dto)
    {
        if (id != dto.InventoryId)
        {
            _logger.LogWarning("[WARN]  Update inventory id mismatch: route={RouteId} body={BodyId}", id, dto.InventoryId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating inventory id={Id}", id);
        var result = await _mediator.Send(new UpdateInventoryCommand(dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Inventory id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Inventory id={Id} updated, stock={Stock}", id, result.CurrentStock);
        return Ok(result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPatch("{id}/restock")]
    public async Task<ActionResult<InventoryDto>> Restock(int id, [FromBody] RestockInventoryDto dto)
    {
        _logger.LogInformation("[INFO]  Restocking inventory id={Id} additionalStock={AdditionalStock} needsRestock={NeedsRestock}",
            id, dto.AdditionalStock, dto.NeedsRestock);
        var result = await _mediator.Send(new RestockInventoryCommand(id, dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Inventory id={Id} not found for restock", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Inventory id={Id} restocked, new stock={Stock}", id, result.CurrentStock);
        return Ok(result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting inventory id={Id}", id);
        var result = await _mediator.Send(new DeleteInventoryCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Inventory id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Inventory id={Id} deleted", id);
        return NoContent();
    }
}
