using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.ProductImages.Commands.CreateProductImage;
using ERP.WEB.Application.Features.ProductImages.Commands.DeleteProductImage;
using ERP.WEB.Application.Features.ProductImages.Commands.UpdateProductImage;
using ERP.WEB.Application.Features.ProductImages.Queries.GetAllProductImages;
using ERP.WEB.Application.Features.ProductImages.Queries.GetImagesByProductId;
using ERP.WEB.Application.Features.ProductImages.Queries.GetProductImageById;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/product-images")]
public class ProductImagesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public ProductImagesController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductImageDto>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllProductImagesQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductImageDto>> GetById(int id)
    {
        var result = await _mediator.Send(new GetProductImageByIdQuery(id));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<ProductImageDto>>> GetByProductId(int productId)
    {
        var result = await _mediator.Send(new GetImagesByProductIdQuery(productId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProductImageDto>> Create([FromBody] CreateProductImageDto dto)
    {
        var result = await _mediator.Send(new CreateProductImageCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.ImageId }, result);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<ActionResult<ProductImageDto>> Upload([FromForm] int productId, [FromForm] bool isPrimary, [FromForm] int displayOrder, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            return BadRequest("Invalid file type. Allowed: jpg, jpeg, png, gif, webp.");

        var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imagePath = $"/uploads/products/{fileName}";

        var dto = new CreateProductImageDto(productId, imagePath, isPrimary, displayOrder);
        var result = await _mediator.Send(new CreateProductImageCommand(dto));

        return CreatedAtAction(nameof(GetById), new { id = result.ImageId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductImageDto>> Update(int id, [FromBody] UpdateProductImageDto dto)
    {
        if (id != dto.ImageId)
            return BadRequest();

        var result = await _mediator.Send(new UpdateProductImageCommand(dto));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        // Get image info before deleting to clean up the file
        var image = await _mediator.Send(new GetProductImageByIdQuery(id));

        var result = await _mediator.Send(new DeleteProductImageCommand(id));

        if (!result)
            return NotFound();

        // Clean up file from disk if it's a local upload
        if (image is not null && image.ImagePath.StartsWith("/uploads/"))
        {
            var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", image.ImagePath.TrimStart('/'));
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        return NoContent();
    }
}
