using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Products.Commands.CreateProduct;
using ERP.WEB.Application.Features.Products.Commands.DeleteProduct;
using ERP.WEB.Application.Features.Products.Commands.SetStockStatus;
using ERP.WEB.Application.Features.Products.Commands.ToggleFavorite;
using ERP.WEB.Application.Features.Products.Commands.UpdateProduct;
using ERP.WEB.Application.Features.Products.Queries.GetAllProducts;
using ERP.WEB.Application.Features.Products.Queries.GetProductById;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

public record SetStockStatusRequest(string? Status);

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IMediator mediator, ILogger<ProductsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll products requested");
        var products = await _mediator.Send(new GetAllProductsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} products", products.Count());
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById product id={Id}", id);
        var product = await _mediator.Send(new GetProductByIdQuery(id));

        if (product is null)
        {
            _logger.LogWarning("[WARN]  Product id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned product id={Id} name={Name}", id, product.Name);
        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto)
    {
        _logger.LogInformation("[INFO]  Creating product name={Name}", dto.Name);
        var product = await _mediator.Send(new CreateProductCommand(dto));
        _logger.LogInformation("[INFO]  Product created id={Id} name={Name}", product.ProductId, product.Name);
        return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, product);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto dto)
    {
        if (id != dto.ProductId)
        {
            _logger.LogWarning("[WARN]  Update product id mismatch: route={RouteId} body={BodyId}", id, dto.ProductId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating product id={Id}", id);
        var product = await _mediator.Send(new UpdateProductCommand(dto));

        if (product is null)
        {
            _logger.LogWarning("[WARN]  Product id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Product id={Id} updated successfully", id);
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting product id={Id}", id);
        var result = await _mediator.Send(new DeleteProductCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Product id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Product id={Id} deleted", id);
        return NoContent();
    }

    [HttpPut("{id}/toggle-favorite")]
    public async Task<ActionResult<bool>> ToggleFavorite(int id)
    {
        var result = await _mediator.Send(new ToggleFavoriteCommand(id));
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id}/stock-status")]
    public async Task<ActionResult> SetStockStatus(int id, [FromBody] SetStockStatusRequest req)
    {
        var result = await _mediator.Send(new SetStockStatusCommand(id, req.Status));
        if (!result) return NotFound();
        return NoContent();
    }
}
