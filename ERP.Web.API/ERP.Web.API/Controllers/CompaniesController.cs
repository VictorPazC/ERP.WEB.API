using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Companies.Commands.CreateCompany;
using ERP.WEB.Application.Features.Companies.Commands.DeleteCompany;
using ERP.WEB.Application.Features.Companies.Commands.UpdateCompany;
using ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;
using ERP.WEB.Application.Features.Companies.Queries.GetCompanyById;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using ERP.Web.API.Authorization;
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
    public async Task<ActionResult<CursorPagedResult<CompanyDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetAllCompaniesQuery(new CursorParams(cursor, pageSize)));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id)
    {
        var company = await _mediator.Send(new GetCompanyByIdQuery(id));
        if (company is null) return NotFound();
        return Ok(company);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create([FromBody] CreateCompanyDto dto)
    {
        var company = await _mediator.Send(new CreateCompanyCommand(dto));
        return CreatedAtAction(nameof(GetById), new { id = company.CompanyId }, company);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id}")]
    public async Task<ActionResult<CompanyDto>> Update(int id, [FromBody] UpdateCompanyDto dto)
    {
        if (id != dto.CompanyId) return BadRequest();
        var company = await _mediator.Send(new UpdateCompanyCommand(dto));
        if (company is null) return NotFound();
        return Ok(company);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        // Reemplaza el acceso directo al repositorio por Mediator,
        // alineando Delete con el patrón CQRS del resto de endpoints.
        await _mediator.Send(new DeleteCompanyCommand(id));
        return NoContent();
    }
}
