using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.UpdateTag;

public record UpdateTagCommand(UpdateTagDto TagDto) : IRequest<TagDto?>;
