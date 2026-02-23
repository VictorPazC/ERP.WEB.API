using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Promotions.Commands.DeletePromotion;

public class DeletePromotionCommandHandler : IRequestHandler<DeletePromotionCommand, bool>
{
    private readonly IPromotionRepository _repository;

    public DeletePromotionCommandHandler(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async ValueTask<bool> Handle(DeletePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotion = await _repository.GetByIdAsync(request.PromoId);

        if (promotion is null)
            return false;

        await _repository.DeleteAsync(request.PromoId);
        return true;
    }
}
