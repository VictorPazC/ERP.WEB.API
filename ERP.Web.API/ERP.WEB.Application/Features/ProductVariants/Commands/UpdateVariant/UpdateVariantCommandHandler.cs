using ERP.WEB.Infrastructure.Data;
using Mediator;

namespace ERP.WEB.Application.Features.ProductVariants.Commands.UpdateVariant;

public class UpdateVariantCommandHandler : IRequestHandler<UpdateVariantCommand, bool>
{
    private readonly ApplicationDbContext _db;

    public UpdateVariantCommandHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async ValueTask<bool> Handle(UpdateVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await _db.ProductVariants.FindAsync(
            new object[] { request.Dto.VariantId }, cancellationToken);

        if (variant is null)
            return false;

        variant.Name = request.Dto.Name;
        variant.Description = request.Dto.Description;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
