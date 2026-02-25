using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Consumptions.Commands.CreateConsumption;
using ERP.WEB.Application.Features.Consumptions.Commands.DeleteConsumption;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAllConsumptions;
using ERP.WEB.Application.Features.Consumptions.Queries.GetAvailableArticles;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.WEB.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConsumptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ConsumptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConsumptionDto>>> GetAll()
    {
        var consumptions = await _mediator.Send(new GetAllConsumptionsQuery());
        return Ok(consumptions);
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<AvailableArticleDto>>> GetAvailable()
    {
        var articles = await _mediator.Send(new GetAvailableArticlesQuery());
        return Ok(articles);
    }

    [HttpPost]
    public async Task<ActionResult<ConsumptionDto>> Create([FromBody] CreateConsumptionDto dto)
    {
        var consumption = await _mediator.Send(new CreateConsumptionCommand(dto));
        return Ok(consumption);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteConsumptionCommand(id));
        if (!result) return NotFound();
        return NoContent();
    }
}
