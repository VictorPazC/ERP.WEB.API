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
    private readonly ILogger<PromotionsController> _logger;

    public PromotionsController(IMediator mediator, ILogger<PromotionsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll promotions requested");
        var result = await _mediator.Send(new GetAllPromotionsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} promotions", result.Count());
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetActive()
    {
        _logger.LogDebug("[DEBUG] GetActive promotions requested");
        var result = await _mediator.Send(new GetActivePromotionsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} active promotions", result.Count());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PromotionDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById promotion id={Id}", id);
        var result = await _mediator.Send(new GetPromotionByIdQuery(id));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Promotion id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned promotion id={Id}", id);
        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> GetByProductId(int productId)
    {
        _logger.LogDebug("[DEBUG] GetPromotionsByProductId productId={ProductId}", productId);
        var result = await _mediator.Send(new GetPromotionsByProductIdQuery(productId));
        _logger.LogInformation("[INFO]  Returned {Count} promotions for productId={ProductId}", result.Count(), productId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PromotionDto>> Create([FromBody] CreatePromotionDto dto)
    {
        _logger.LogInformation("[INFO]  Creating promotion for productId={ProductId} discount={Discount}%", dto.ProductId, dto.DiscountPercentage);
        var result = await _mediator.Send(new CreatePromotionCommand(dto));
        _logger.LogInformation("[INFO]  Promotion created id={Id}", result.PromoId);
        return CreatedAtAction(nameof(GetById), new { id = result.PromoId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PromotionDto>> Update(int id, [FromBody] UpdatePromotionDto dto)
    {
        if (id != dto.PromoId)
        {
            _logger.LogWarning("[WARN]  Update promotion id mismatch: route={RouteId} body={BodyId}", id, dto.PromoId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating promotion id={Id}", id);
        var result = await _mediator.Send(new UpdatePromotionCommand(dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Promotion id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Promotion id={Id} updated successfully", id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting promotion id={Id}", id);
        var result = await _mediator.Send(new DeletePromotionCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Promotion id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Promotion id={Id} deleted", id);
        return NoContent();
    }
}
