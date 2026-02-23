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

    public ProductImagesController(IMediator mediator)
    {
        _mediator = mediator;
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
        var result = await _mediator.Send(new DeleteProductImageCommand(id));

        if (!result)
            return NotFound();

        return NoContent();
    }
}
