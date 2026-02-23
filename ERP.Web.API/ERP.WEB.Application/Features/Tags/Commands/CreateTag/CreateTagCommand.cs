using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.CreateTag;

public record CreateTagCommand(CreateTagDto TagDto) : IRequest<TagDto>;
