using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetTagsByProductId;

public record GetTagsByProductIdQuery(int ProductId) : IRequest<IEnumerable<TagDto>>;
