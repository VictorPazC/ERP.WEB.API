using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.CreateCompany;

public record CreateCompanyCommand(CreateCompanyDto Dto) : IRequest<CompanyDto>;
