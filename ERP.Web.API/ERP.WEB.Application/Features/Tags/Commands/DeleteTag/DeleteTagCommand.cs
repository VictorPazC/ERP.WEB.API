using Mediator;

namespace ERP.WEB.Application.Features.Tags.Commands.DeleteTag;

public record DeleteTagCommand(int TagId) : IRequest<bool>;
