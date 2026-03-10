using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Categories.Commands.CreateCategory;
using ERP.WEB.Application.Features.Categories.Commands.DeleteCategory;
using ERP.WEB.Application.Features.Categories.Commands.UpdateCategory;
using ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;
using ERP.WEB.Application.Features.Categories.Queries.GetCategoryById;
using ERP.WEB.Application.Features.Categories.Queries.GetMainCategories;
using ERP.WEB.Application.Features.Categories.Queries.GetSubCategories;
using ERP.WEB.Domain.Interfaces;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using ERP.Web.API.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CategoriesController> _logger;
    private readonly ICategoryRepository _categoryRepo;
    private readonly IWebHostEnvironment _env;

    public CategoriesController(IMediator mediator, ILogger<CategoriesController> logger,
        ICategoryRepository categoryRepo, IWebHostEnvironment env)
    {
        _mediator     = mediator;
        _logger       = logger;
        _categoryRepo = categoryRepo;
        _env          = env;
    }

    [HttpGet]
    public async Task<ActionResult<CursorPagedResult<CategoryDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetAll categories cursor={Cursor} pageSize={PageSize}", cursor, pageSize);
        var result = await _mediator.Send(new GetAllCategoriesQuery(new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} categories hasMore={HasMore}", result.Items.Count(), result.HasMore);
        return Ok(result);
    }

    [HttpGet("main")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetMainCategories()
    {
        _logger.LogDebug("[DEBUG] GetMainCategories requested");
        var categories = await _mediator.Send(new GetMainCategoriesQuery());
        _logger.LogInformation("[INFO]  Returned {Count} main categories", categories.Count());
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById category id={Id}", id);
        var category = await _mediator.Send(new GetCategoryByIdQuery(id));

        if (category is null)
        {
            _logger.LogWarning("[WARN]  Category id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned category id={Id} name={Name}", id, category.Name);
        return Ok(category);
    }

    [HttpGet("{id}/subcategories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetSubCategories(int id)
    {
        _logger.LogDebug("[DEBUG] GetSubCategories for parent id={Id}", id);
        var categories = await _mediator.Send(new GetSubCategoriesQuery(id));
        _logger.LogInformation("[INFO]  Returned {Count} subcategories for parent id={Id}", categories.Count(), id);
        return Ok(categories);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        _logger.LogInformation("[INFO]  Creating category name={Name}", dto.Name);
        var category = await _mediator.Send(new CreateCategoryCommand(dto));
        _logger.LogInformation("[INFO]  Category created id={Id} name={Name}", category.CategoryId, category.Name);
        return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, category);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryDto dto)
    {
        if (id != dto.CategoryId)
        {
            _logger.LogWarning("[WARN]  Update category id mismatch: route={RouteId} body={BodyId}", id, dto.CategoryId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating category id={Id}", id);
        var category = await _mediator.Send(new UpdateCategoryCommand(dto));

        if (category is null)
        {
            _logger.LogWarning("[WARN]  Category id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Category id={Id} updated successfully", id);
        return Ok(category);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting category id={Id}", id);
        var result = await _mediator.Send(new DeleteCategoryCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Category id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Category id={Id} deleted", id);
        return NoContent();
    }

    /// <summary>Upload or replace the banner image for a category (max 5 MB).</summary>
    [Authorize(Policy = Policies.Admin)]
    [HttpPost("{id}/image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<object>> UploadImage(int id, IFormFile file)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category is null) return NotFound();

        // Validate
        if (file is null || file.Length == 0) return BadRequest("No file provided.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp" or ".gif"))
            return BadRequest("Unsupported file type.");

        // Save to wwwroot/uploads/categories/
        var uploadDir = Path.Combine(_env.WebRootPath, "uploads", "categories");
        Directory.CreateDirectory(uploadDir);

        // Delete old image file if it was locally stored
        if (!string.IsNullOrEmpty(category.ImagePath) && category.ImagePath.StartsWith("/uploads/"))
        {
            var oldPath = Path.Combine(_env.WebRootPath, category.ImagePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var fileName  = $"cat_{id}_{Guid.NewGuid():N}{ext}";
        var fullPath  = Path.Combine(uploadDir, fileName);
        await using var stream = System.IO.File.Create(fullPath);
        await file.CopyToAsync(stream);

        category.ImagePath = $"/uploads/categories/{fileName}";
        await _categoryRepo.UpdateAsync(category);

        _logger.LogInformation("[INFO]  Category {Id} image updated to {Path}", id, category.ImagePath);
        return Ok(new { imagePath = category.ImagePath });
    }
}
