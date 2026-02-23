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

    public TagsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllTagsQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TagDto>> GetById(int id)
    {
        var result = await _mediator.Send(new GetTagByIdQuery(id));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<TagDto>>> GetByProductId(int productId)
    {
        var result = await _mediator.Send(new GetTagsByProductIdQuery(productId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TagDto>> Create([FromBody] CreateTagDto dto)
    {
        var result = await _mediator.Send(new CreateTagCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = result.TagId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TagDto>> Update(int id, [FromBody] UpdateTagDto dto)
    {
        if (id != dto.TagId)
            return BadRequest();

        var result = await _mediator.Send(new UpdateTagCommand(dto));

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteTagCommand(id));

        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{tagId}/products/{productId}")]
    public async Task<ActionResult> AddTagToProduct(int tagId, int productId)
    {
        await _mediator.Send(new AddTagToProductCommand(tagId, productId));
        return NoContent();
    }

    [HttpDelete("{tagId}/products/{productId}")]
    public async Task<ActionResult> RemoveTagFromProduct(int tagId, int productId)
    {
        await _mediator.Send(new RemoveTagFromProductCommand(tagId, productId));
        return NoContent();
    }
}
