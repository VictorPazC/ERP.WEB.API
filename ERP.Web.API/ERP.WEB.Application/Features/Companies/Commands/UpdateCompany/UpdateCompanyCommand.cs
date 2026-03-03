using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.UpdateCompany;

public record UpdateCompanyCommand(UpdateCompanyDto Dto) : IRequest<CompanyDto?>;
