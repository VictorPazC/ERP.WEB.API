using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.CreateCompany;

public class CreateCompanyCommandHandler : IRequestHandler<CreateCompanyCommand, CompanyDto>
{
    private readonly ICompanyRepository _repo;

    public CreateCompanyCommandHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<CompanyDto> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var company = new Company
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Description = dto.Description,
            LogoUrl = dto.LogoUrl,
            CustomDomain = dto.CustomDomain,
            PrimaryColor = dto.PrimaryColor,
        };

        await _repo.AddAsync(company);

        return new CompanyDto(
            company.CompanyId, company.Name, company.Slug, company.Description,
            company.LogoUrl, company.CustomDomain, company.PrimaryColor,
            company.IsActive, company.CreatedAt
        );
    }
}
