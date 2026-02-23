using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Queries.GetTagById;

public record GetTagByIdQuery(int TagId) : IRequest<TagDto?>;
