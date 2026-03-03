using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.ProductImages.Commands.CreateProductImage;
using ERP.WEB.Application.Features.ProductImages.Commands.DeleteProductImage;
using ERP.WEB.Application.Features.ProductImages.Commands.UpdateProductImage;
using ERP.WEB.Application.Features.ProductImages.Queries.GetAllProductImages;
using ERP.WEB.Application.Features.ProductImages.Queries.GetImagesByProductId;
using ERP.WEB.Application.Features.ProductImages.Queries.GetProductImageById;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/product-images")]
public class ProductImagesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ProductImagesController> _logger;

    public ProductImagesController(IMediator mediator, IWebHostEnvironment env, ILogger<ProductImagesController> logger)
    {
        _mediator = mediator;
        _env      = env;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductImageDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll product images requested");
        var result = await _mediator.Send(new GetAllProductImagesQuery());
        _logger.LogInformation("[INFO]  Returned {Count} product images", result.Count());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductImageDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById product image id={Id}", id);
        var result = await _mediator.Send(new GetProductImageByIdQuery(id));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Product image id={Id} not found", id);
            return NotFound();
        }

        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<ProductImageDto>>> GetByProductId(int productId)
    {
        _logger.LogDebug("[DEBUG] GetImagesByProductId productId={ProductId}", productId);
        var result = await _mediator.Send(new GetImagesByProductIdQuery(productId));
        _logger.LogInformation("[INFO]  Returned {Count} images for productId={ProductId}", result.Count(), productId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProductImageDto>> Create([FromBody] CreateProductImageDto dto)
    {
        _logger.LogInformation("[INFO]  Creating product image for productId={ProductId}", dto.ProductId);
        var result = await _mediator.Send(new CreateProductImageCommand(dto));
        _logger.LogInformation("[INFO]  Product image created id={Id}", result.ImageId);
        return CreatedAtAction(nameof(GetById), new { id = result.ImageId }, result);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ProductImageDto>> Upload([FromForm] int productId, [FromForm] bool isPrimary, [FromForm] int displayOrder, IFormFile file, [FromForm] int? variantId = null)
    {
        if (file is null || file.Length == 0)
        {
            _logger.LogWarning("[WARN]  Upload called with no file for productId={ProductId}", productId);
            return BadRequest("No file provided.");
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            _logger.LogWarning("[WARN]  Invalid file type={Ext} for productId={ProductId}", ext, productId);
            return BadRequest("Invalid file type. Allowed: jpg, jpeg, png, gif, webp.");
        }

        _logger.LogInformation("[INFO]  Uploading image for productId={ProductId} size={SizeKb}KB isPrimary={IsPrimary}",
            productId, file.Length / 1024, isPrimary);

        var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imagePath = $"/uploads/products/{fileName}";

        var dto = new CreateProductImageDto(productId, imagePath, isPrimary, displayOrder, variantId);
        var result = await _mediator.Send(new CreateProductImageCommand(dto));

        _logger.LogInformation("[INFO]  Image uploaded id={Id} path={Path}", result.ImageId, imagePath);
        return CreatedAtAction(nameof(GetById), new { id = result.ImageId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductImageDto>> Update(int id, [FromBody] UpdateProductImageDto dto)
    {
        if (id != dto.ImageId)
        {
            _logger.LogWarning("[WARN]  Update image id mismatch: route={RouteId} body={BodyId}", id, dto.ImageId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating product image id={Id}", id);
        var result = await _mediator.Send(new UpdateProductImageCommand(dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Product image id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Product image id={Id} updated", id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting product image id={Id}", id);
        var image = await _mediator.Send(new GetProductImageByIdQuery(id));

        var result = await _mediator.Send(new DeleteProductImageCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Product image id={Id} not found for deletion", id);
            return NotFound();
        }

        if (image is not null && image.ImagePath.StartsWith("/uploads/"))
        {
            var slashChar = '/';
            var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart(slashChar));
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
                _logger.LogDebug("[DEBUG] Deleted file from disk: {Path}", fullPath);
            }
        }

        _logger.LogInformation("[INFO]  Product image id={Id} deleted", id);
        return NoContent();
    }
}
