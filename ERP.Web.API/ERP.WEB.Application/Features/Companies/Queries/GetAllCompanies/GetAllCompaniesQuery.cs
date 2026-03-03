using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;

public record GetAllCompaniesQuery() : IRequest<IEnumerable<CompanyDto>>;
