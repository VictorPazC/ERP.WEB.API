using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetAllTags;

public record GetAllTagsQuery(CursorParams Params) : IRequest<CursorPagedResult<TagDto>>;
