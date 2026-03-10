using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Consumptions.Commands.CreateConsumption;
using ERP.WEB.Application.Features.Consumptions.Commands.DeleteConsumption;
using ERP.WEB.Application.Features.Consumptions.Commands.UpdateConsumption;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAvailableArticles;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using ERP.Web.API.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConsumptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ConsumptionsController> _logger;

    public ConsumptionsController(IMediator mediator, ILogger<ConsumptionsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<CursorPagedResult<ConsumptionDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetAll consumptions cursor={Cursor} pageSize={PageSize}", cursor, pageSize);
        var result = await _mediator.Send(new GetAllConsumptionsQuery(new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} consumptions hasMore={HasMore}", result.Items.Count(), result.HasMore);
        return Ok(result);
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<AvailableArticleDto>>> GetAvailable()
    {
        _logger.LogDebug("[DEBUG] GetAvailable articles requested");
        var articles = await _mediator.Send(new GetAvailableArticlesQuery());
        _logger.LogInformation("[INFO]  Returned {Count} available articles", articles.Count());
        return Ok(articles);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<ConsumptionDto>> Create([FromBody] CreateConsumptionDto dto)
    {
        _logger.LogInformation("[INFO]  Creating consumption inventoryId={InventoryId} quantity={Quantity}", dto.InventoryId, dto.Quantity);
        var consumption = await _mediator.Send(new CreateConsumptionCommand(dto));
        _logger.LogInformation("[INFO]  Consumption created id={Id} for inventoryId={InventoryId}", consumption.ConsumptionId, consumption.InventoryId);
        return Ok(consumption);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateConsumptionDto dto)
    {
        // Decisión 7B: edita Quantity + Notes y ajusta stock en una sola operación.
        if (id != dto.ConsumptionId)
        {
            _logger.LogWarning("[WARN]  Update consumption id mismatch: route={RouteId} body={BodyId}", id, dto.ConsumptionId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating consumption id={Id} quantity={Quantity}", id, dto.Quantity);
        var result = await _mediator.Send(new UpdateConsumptionCommand(dto.ConsumptionId, dto.Quantity, dto.Notes, dto.PaymentMethod));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Consumption id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Consumption id={Id} updated", id);
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting consumption id={Id}", id);
        var result = await _mediator.Send(new DeleteConsumptionCommand(id));
        if (!result)
        {
            _logger.LogWarning("[WARN]  Consumption id={Id} not found for deletion", id);
            return NotFound();
        }
        _logger.LogInformation("[INFO]  Consumption id={Id} deleted", id);
        return NoContent();
    }
}
