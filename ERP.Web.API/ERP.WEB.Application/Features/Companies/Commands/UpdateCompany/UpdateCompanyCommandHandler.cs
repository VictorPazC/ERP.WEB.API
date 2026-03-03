using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.UpdateCompany;

public class UpdateCompanyCommandHandler : IRequestHandler<UpdateCompanyCommand, CompanyDto?>
{
    private readonly ICompanyRepository _repo;

    public UpdateCompanyCommandHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<CompanyDto?> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var company = await _repo.GetByIdAsync(dto.CompanyId);
        if (company is null) return null;

        company.Name = dto.Name;
        company.Slug = dto.Slug;
        company.Description = dto.Description;
        company.LogoUrl = dto.LogoUrl;
        company.CustomDomain = dto.CustomDomain;
        company.PrimaryColor = dto.PrimaryColor;
        company.IsActive = dto.IsActive;

        await _repo.UpdateAsync(company);

        return new CompanyDto(
            company.CompanyId, company.Name, company.Slug, company.Description,
            company.LogoUrl, company.CustomDomain, company.PrimaryColor,
            company.IsActive, company.CreatedAt
        );
    }
}
