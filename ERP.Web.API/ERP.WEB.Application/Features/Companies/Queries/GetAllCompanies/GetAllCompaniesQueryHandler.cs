using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;

public class GetAllCompaniesQueryHandler : IRequestHandler<GetAllCompaniesQuery, IEnumerable<CompanyDto>>
{
    private readonly ICompanyRepository _repo;

    public GetAllCompaniesQueryHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<IEnumerable<CompanyDto>> Handle(GetAllCompaniesQuery request, CancellationToken cancellationToken)
    {
        var companies = await _repo.GetAllAsync();
        return companies.Select(p => new CompanyDto(
            p.CompanyId, p.Name, p.Slug, p.Description,
            p.LogoUrl, p.CustomDomain, p.PrimaryColor,
            p.IsActive, p.CreatedAt
        ));
    }
}
