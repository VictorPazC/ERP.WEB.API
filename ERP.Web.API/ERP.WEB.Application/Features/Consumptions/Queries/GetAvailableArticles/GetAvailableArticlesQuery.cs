using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Queries.GetAvailableArticles;

public record GetAvailableArticlesQuery : IRequest<IEnumerable<AvailableArticleDto>>;
