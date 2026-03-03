using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetCompanyById;

public class GetCompanyByIdQueryHandler : IRequestHandler<GetCompanyByIdQuery, CompanyDto?>
{
    private readonly ICompanyRepository _repo;

    public GetCompanyByIdQueryHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<CompanyDto?> Handle(GetCompanyByIdQuery request, CancellationToken cancellationToken)
    {
        var p = await _repo.GetByIdAsync(request.CompanyId);
        if (p is null) return null;
        return new CompanyDto(
            p.CompanyId, p.Name, p.Slug, p.Description,
            p.LogoUrl, p.CustomDomain, p.PrimaryColor,
            p.IsActive, p.CreatedAt
        );
    }
}
