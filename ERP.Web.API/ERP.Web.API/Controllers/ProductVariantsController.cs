using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.ProductVariants.Commands.CreateVariant;
using ERP.WEB.Application.Features.ProductVariants.Commands.DeleteVariant;
using ERP.WEB.Application.Features.ProductVariants.Commands.UpdateVariant;
using ERP.WEB.Application.Features.ProductVariants.Queries.GetVariantsByProduct;
using Mediator;
using Microsoft.AspNetCore.Authorization;
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

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<List<ProductVariantDto>>> GetByProduct(int productId)
    {
        _logger.LogDebug("[DEBUG] GetVariantsByProduct productId={ProductId}", productId);
        var variants = await _mediator.Send(new GetVariantsByProductQuery(productId));
        _logger.LogInformation("[INFO]  Returned {Count} variants for productId={ProductId}", variants.Count, productId);
        return Ok(variants);
    }

    [HttpPost]
    public async Task<ActionResult<int>> Create([FromBody] CreateProductVariantDto dto)
    {
        _logger.LogInformation("[INFO]  Creating variant for productId={ProductId}", dto.ProductId);
        var variantId = await _mediator.Send(new CreateVariantCommand(dto));
        _logger.LogInformation("[INFO]  Variant created id={VariantId}", variantId);
        return CreatedAtAction(nameof(GetByProduct), new { productId = dto.ProductId }, variantId);
    }

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
