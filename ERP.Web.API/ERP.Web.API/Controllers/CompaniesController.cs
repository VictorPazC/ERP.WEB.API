using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Companies.Commands.CreateCompany;
using ERP.WEB.Application.Features.Companies.Commands.UpdateCompany;
using ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;
using ERP.WEB.Application.Features.Companies.Queries.GetCompanyById;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CompaniesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetAll()
    {
        var companies = await _mediator.Send(new GetAllCompaniesQuery());
        return Ok(companies);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id)
    {
        var company = await _mediator.Send(new GetCompanyByIdQuery(id));
        if (company is null) return NotFound();
        return Ok(company);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create([FromBody] CreateCompanyDto dto)
    {
        var company = await _mediator.Send(new CreateCompanyCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = company.CompanyId }, company);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CompanyDto>> Update(int id, [FromBody] UpdateCompanyDto dto)
    {
        if (id != dto.CompanyId) return BadRequest();
        var company = await _mediator.Send(new UpdateCompanyCommand(dto));
        if (company is null) return NotFound();
        return Ok(company);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var repo = HttpContext.RequestServices.GetRequiredService<ERP.WEB.Domain.Interfaces.ICompanyRepository>();
        await repo.DeleteAsync(id);
        return NoContent();
    }
}
