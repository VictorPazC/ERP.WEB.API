using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;

public record GetAllCompaniesQuery(CursorParams Params) : IRequest<CursorPagedResult<CompanyDto>>;
