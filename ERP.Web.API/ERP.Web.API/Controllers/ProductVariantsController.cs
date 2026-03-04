using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.ProductVariants.Commands.CreateVariant;
using ERP.WEB.Application.Features.ProductVariants.Commands.DeleteVariant;
using ERP.WEB.Application.Features.ProductVariants.Commands.UpdateVariant;
using ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantById;
using ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantsByProduct;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using ERP.Web.API.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/product-variants")]
public class ProductVariantsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductVariantsController> _logger;

    public ProductVariantsController(IMediator mediator, ILogger<ProductVariantsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductVariantDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetVariantById id={Id}", id);
        var variant = await _mediator.Send(new GetVariantByIdQuery(id));
        if (variant is null)
        {
            _logger.LogWarning("[WARN]  Variant id={Id} not found", id);
            return NotFound();
        }
        _logger.LogInformation("[INFO]  Returned variant id={Id}", id);
        return Ok(variant);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<CursorPagedResult<ProductVariantDto>>> GetByProduct(
        int productId, [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetVariantsByProduct productId={ProductId} cursor={Cursor}", productId, cursor);
        var result = await _mediator.Send(new GetVariantsByProductQuery(productId, new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} variants for productId={ProductId} hasMore={HasMore}", result.Items.Count(), productId, result.HasMore);
        return Ok(result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<int>> Create([FromBody] CreateProductVariantDto dto)
    {
        _logger.LogInformation("[INFO]  Creating variant for productId={ProductId}", dto.ProductId);
        var variantId = await _mediator.Send(new CreateVariantCommand(dto));
        _logger.LogInformation("[INFO]  Variant created id={VariantId}", variantId);
        return CreatedAtAction(nameof(GetByProduct), new { productId = dto.ProductId }, variantId);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateProductVariantDto dto)
    {
        if (id != dto.VariantId)
        {
            _logger.LogWarning("[WARN]  Update variant id mismatch: route={RouteId} body={BodyId}", id, dto.VariantId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating variant id={Id}", id);
        var result = await _mediator.Send(new UpdateVariantCommand(dto));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Variant id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Variant id={Id} updated successfully", id);
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting variant id={Id}", id);
        var result = await _mediator.Send(new DeleteVariantCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Variant id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Variant id={Id} deleted", id);
        return NoContent();
    }
}
