using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetCompanyById;

public record GetCompanyByIdQuery(int CompanyId) : IRequest<CompanyDto?>;
