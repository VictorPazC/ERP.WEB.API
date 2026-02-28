using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Brands.Commands.CreateBrand;
using ERP.WEB.Application.Features.Brands.Commands.DeleteBrand;
using ERP.WEB.Application.Features.Brands.Commands.SetDefaultBrand;
using ERP.WEB.Application.Features.Brands.Commands.UpdateBrand;
using ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;
using ERP.WEB.Application.Features.Brands.Queries.GetBrandById;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(IMediator mediator, ILogger<BrandsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BrandDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll brands requested");
        var result = await _mediator.Send(new GetAllBrandsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} brands", result.Count());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BrandDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById brand id={Id}", id);
        var result = await _mediator.Send(new GetBrandByIdQuery(id));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Brand id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned brand id={Id} name={Name}", id, result.Name);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BrandDto>> Create([FromBody] CreateBrandDto dto)
    {
        _logger.LogInformation("[INFO]  Creating brand name={Name}", dto.Name);
        var result = await _mediator.Send(new CreateBrandCommand(dto));
        _logger.LogInformation("[INFO]  Brand created id={Id} name={Name}", result.BrandId, result.Name);
        return CreatedAtAction(nameof(GetById), new { id = result.BrandId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BrandDto>> Update(int id, [FromBody] UpdateBrandDto dto)
    {
        if (id != dto.BrandId)
        {
            _logger.LogWarning("[WARN]  Update brand id mismatch: route={RouteId} body={BodyId}", id, dto.BrandId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating brand id={Id}", id);
        var result = await _mediator.Send(new UpdateBrandCommand(dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Brand id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Brand id={Id} updated successfully", id);
        return Ok(result);
    }

    [HttpPut("{id}/set-default")]
    public async Task<ActionResult> SetDefault(int id)
    {
        _logger.LogInformation("[INFO]  Setting default brand id={Id}", id);
        var result = await _mediator.Send(new SetDefaultBrandCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Brand id={Id} not found for set-default", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Brand id={Id} set as default", id);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting brand id={Id}", id);
        var result = await _mediator.Send(new DeleteBrandCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Brand id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Brand id={Id} deleted", id);
        return NoContent();
    }
}
