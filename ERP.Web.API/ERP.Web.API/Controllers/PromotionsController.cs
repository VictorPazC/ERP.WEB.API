using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Promotions.Commands.CreatePromotion;
using ERP.WEB.Application.Features.Promotions.Commands.DeletePromotion;
using ERP.WEB.Application.Features.Promotions.Commands.UpdatePromotion;
using ERP.WEB.Application.Features.Promotions.Queries.GetActivePromotions;
using ERP.WEB.Application.Features.Promotions.Queries.GetAllPromotions;
using ERP.WEB.Application.Features.Promotions.Queries.GetPromotionById;
using ERP.WEB.Application.Features.Promotions.Queries.GetPromotionsByProductId;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromotionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PromotionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllPromotionsQuery());
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetActive()
    {
        var result = await _mediator.Send(new GetActivePromotionsQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PromotionDto>> GetById(int id)
    {
        var result = await _mediator.Send(new GetPromotionByIdQuery(id));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetByProductId(int productId)
    {
        var result = await _mediator.Send(new GetPromotionsByProductIdQuery(productId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PromotionDto>> Create([FromBody] CreatePromotionDto dto)
    {
        var result = await _mediator.Send(new CreatePromotionCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.PromoId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PromotionDto>> Update(int id, [FromBody] UpdatePromotionDto dto)
    {
        if (id != dto.PromoId)
            return BadRequest();

        var result = await _mediator.Send(new UpdatePromotionCommand(dto));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeletePromotionCommand(id));

        if (!result)
            return NotFound();

        return NoContent();
    }
}
