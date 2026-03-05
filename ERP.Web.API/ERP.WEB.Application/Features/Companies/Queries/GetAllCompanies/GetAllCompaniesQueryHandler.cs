using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Queries.GetAllCompanies;

public class GetAllCompaniesQueryHandler : IRequestHandler<GetAllCompaniesQuery, CursorPagedResult<CompanyDto>>
{
    private readonly ICompanyRepository _repo;

    public GetAllCompaniesQueryHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<CursorPagedResult<CompanyDto>> Handle(GetAllCompaniesQuery request, CancellationToken cancellationToken)
    {
        var list = await _repo.GetAllAsync(request.Params, cancellationToken);
        var hasMore = list.Count > request.Params.PageSize;
        if (hasMore) list.RemoveAt(list.Count - 1);
        var nextCursor = hasMore ? CursorHelper.Encode(list[^1].CompanyId) : null;
        var items = list.Select(p => new CompanyDto(p.CompanyId, p.Name, p.Slug, p.Description, p.LogoUrl, p.CustomDomain, p.PrimaryColor, p.IsActive, p.CreatedAt));
        return new CursorPagedResult<CompanyDto>(items, nextCursor, hasMore);
    }
}
