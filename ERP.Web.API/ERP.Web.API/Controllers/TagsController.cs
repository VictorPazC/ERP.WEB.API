using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Tags.Commands.AddTagToProduct;
using ERP.WEB.Application.Features.Tags.Commands.CreateTag;
using ERP.WEB.Application.Features.Tags.Commands.DeleteTag;
using ERP.WEB.Application.Features.Tags.Commands.RemoveTagFromProduct;
using ERP.WEB.Application.Features.Tags.Commands.UpdateTag;
using ERP.WEB.Application.Features.Tags.Queries.GetAllTags;
using ERP.WEB.Application.Features.Tags.Queries.GetTagById;
using ERP.WEB.Application.Features.Tags.Queries.GetTagsByProductId;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TagsController> _logger;

    public TagsController(IMediator mediator, ILogger<TagsController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetAll()
    {
        _logger.LogDebug("[DEBUG] GetAll tags requested");
        var result = await _mediator.Send(new GetAllTagsQuery());
        _logger.LogInformation("[INFO]  Returned {Count} tags", result.Count());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TagDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById tag id={Id}", id);
        var result = await _mediator.Send(new GetTagByIdQuery(id));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Tag id={Id} not found", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Returned tag id={Id} name={Name}", id, result.TagName);
        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetByProductId(int productId)
    {
        _logger.LogDebug("[DEBUG] GetTagsByProductId productId={ProductId}", productId);
        var result = await _mediator.Send(new GetTagsByProductIdQuery(productId));
        _logger.LogInformation("[INFO]  Returned {Count} tags for productId={ProductId}", result.Count(), productId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TagDto>> Create([FromBody] CreateTagDto dto)
    {
        _logger.LogInformation("[INFO]  Creating tag name={Name}", dto.TagName);
        var result = await _mediator.Send(new CreateTagCommand(dto));
        _logger.LogInformation("[INFO]  Tag created id={Id} name={Name}", result.TagId, result.TagName);
        return CreatedAtAction(nameof(GetById), new { id = result.TagId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TagDto>> Update(int id, [FromBody] UpdateTagDto dto)
    {
        if (id != dto.TagId)
        {
            _logger.LogWarning("[WARN]  Update tag id mismatch: route={RouteId} body={BodyId}", id, dto.TagId);
            return BadRequest();
        }

        _logger.LogInformation("[INFO]  Updating tag id={Id}", id);
        var result = await _mediator.Send(new UpdateTagCommand(dto));

        if (result is null)
        {
            _logger.LogWarning("[WARN]  Tag id={Id} not found for update", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Tag id={Id} updated to name={Name}", id, result.TagName);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting tag id={Id}", id);
        var result = await _mediator.Send(new DeleteTagCommand(id));

        if (!result)
        {
            _logger.LogWarning("[WARN]  Tag id={Id} not found for deletion", id);
            return NotFound();
        }

        _logger.LogInformation("[INFO]  Tag id={Id} deleted", id);
        return NoContent();
    }

    [HttpPost("{tagId}/products/{productId}")]
    public async Task<ActionResult> AddTagToProduct(int tagId, int productId)
    {
        _logger.LogInformation("[INFO]  Adding tag id={TagId} to product id={ProductId}", tagId, productId);
        await _mediator.Send(new AddTagToProductCommand(tagId, productId));
        _logger.LogInformation("[INFO]  Tag id={TagId} added to product id={ProductId}", tagId, productId);
        return NoContent();
    }

    [HttpDelete("{tagId}/products/{productId}")]
    public async Task<ActionResult> RemoveTagFromProduct(int tagId, int productId)
    {
        _logger.LogInformation("[INFO]  Removing tag id={TagId} from product id={ProductId}", tagId, productId);
        await _mediator.Send(new RemoveTagFromProductCommand(tagId, productId));
        _logger.LogInformation("[INFO]  Tag id={TagId} removed from product id={ProductId}", tagId, productId);
        return NoContent();
    }
}
