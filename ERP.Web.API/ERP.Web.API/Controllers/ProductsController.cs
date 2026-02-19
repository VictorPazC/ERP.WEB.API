using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Products.Commands.CreateProduct;
using ERP.WEB.Application.Features.Products.Commands.DeleteProduct;
using ERP.WEB.Application.Features.Products.Commands.UpdateProduct;
using ERP.WEB.Application.Features.Products.Queries.GetAllProducts;
using ERP.WEB.Application.Features.Products.Queries.GetProductById;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ERP.WEB.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
    {
        var products = await _mediator.Send(new GetAllProductsQuery());
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _mediator.Send(new GetProductByIdQuery(id));
        
        if (product is null)
            return NotFound();

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto)
    {
        var product = await _mediator.Send(new CreateProductCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, product);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto dto)
    {
        if (id != dto.ProductId)
            return BadRequest();

        var product = await _mediator.Send(new UpdateProductCommand(dto));
        
        if (product is null)
            return NotFound();

        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteProductCommand(id));
        
        if (!result)
            return NotFound();

        return NoContent();
    }
}