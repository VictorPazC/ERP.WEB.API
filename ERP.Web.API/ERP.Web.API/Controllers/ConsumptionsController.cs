using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Consumptions.Commands.CreateConsumption;
using ERP.WEB.Application.Features.Consumptions.Commands.DeleteConsumption;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAvailableArticles;
using Mediator;
using Microsoft.AspNetCore.Authorization;
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
    public async Task<ActionResult<IEnumerable<ConsumptionDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll consumptions requested");
        var consumptions = await _mediator.Send(new GetAllConsumptionsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} consumptions", consumptions.Count());
        return Ok(consumptions);
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<AvailableArticleDto>>> GetAvailable()
    {
        _logger.LogDebug("[DEBUG] GetAvailable articles requested");
        var articles = await _mediator.Send(new GetAvailableArticlesQuery());
        _logger.LogInformation("[INFO]  Returned {Count} available articles", articles.Count());
        return Ok(articles);
    }

    [HttpPost]
    public async Task<ActionResult<ConsumptionDto>> Create([FromBody] CreateConsumptionDto dto)
    {
        _logger.LogInformation("[INFO]  Creating consumption inventoryId={InventoryId} quantity={Quantity}", dto.InventoryId, dto.Quantity);
        var consumption = await _mediator.Send(new CreateConsumptionCommand(dto));
        _logger.LogInformation("[INFO]  Consumption created id={Id} for inventoryId={InventoryId}", consumption.ConsumptionId, consumption.InventoryId);
        return Ok(consumption);
    }

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
