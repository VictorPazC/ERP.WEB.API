using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetAllTags;

public record GetAllTagsQuery : IRequest<IEnumerable<TagDto>>;
