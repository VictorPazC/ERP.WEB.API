using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Categories.Commands.CreateCategory;
using ERP.WEB.Application.Features.Categories.Commands.DeleteCategory;
using ERP.WEB.Application.Features.Categories.Commands.UpdateCategory;
using ERP.WEB.Application.Features.Categories.Queries.GetAllCategories;
using ERP.WEB.Application.Features.Categories.Queries.GetCategoryById;
using ERP.WEB.Application.Features.Categories.Queries.GetMainCategories;
using ERP.WEB.Application.Features.Categories.Queries.GetSubCategories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await _mediator.Send(new GetAllCategoriesQuery());
        return Ok(categories);
    }

    [HttpGet("main")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetMainCategories()
    {
        var categories = await _mediator.Send(new GetMainCategoriesQuery());
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _mediator.Send(new GetCategoryByIdQuery(id));
        
        if (category is null)
            return NotFound();

        return Ok(category);
    }

    [HttpGet("{id}/subcategories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetSubCategories(int id)
    {
        var categories = await _mediator.Send(new GetSubCategoriesQuery(id));
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var category = await _mediator.Send(new CreateCategoryCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryDto dto)
    {
        if (id != dto.CategoryId)
            return BadRequest();

        var category = await _mediator.Send(new UpdateCategoryCommand(dto));
        
        if (category is null)
            return NotFound();

        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteCategoryCommand(id));
        
        if (!result)
            return NotFound();

        return NoContent();
    }
}