using ERP.WEB.Application.DTOs;
using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Consumptions.Queries.GetAvailableArticles;

public class GetAvailableArticlesQueryHandler : IRequestHandler<GetAvailableArticlesQuery, IEnumerable<AvailableArticleDto>>
{
    private readonly IInventoryRepository _inventoryRepository;

    public GetAvailableArticlesQueryHandler(IInventoryRepository inventoryRepository)
    {
        _inventoryRepository = inventoryRepository;
    }

    public async ValueTask<IEnumerable<AvailableArticleDto>> Handle(GetAvailableArticlesQuery request, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryRepository.GetAllAsync(new CursorParams(null, 10_000), cancellationToken);
        return inventory
            .Where(i => i.CurrentStock > 0)
            .Select(i => new AvailableArticleDto(
                i.InventoryId,
                i.ProductId,
                i.Product?.Name ?? $"Product #{i.ProductId}",
                i.Product?.Category?.Name,
                i.Product?.CategoryId ?? 0,
                i.PurchaseCost,
                i.SuggestedRetailPrice,
                i.CurrentStock,
                i.VariantId,
                i.Variant?.Name
            ));
    }
}
