using ERP.WEB.Domain.Interfaces;
using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.DeleteCompany;

// Delega directamente al repositorio — ICompanyRepository.DeleteAsync ya existe.
// Mismo patrón que DeleteBrandCommandHandler, DeleteCategoryCommandHandler, etc.
// ValueTask<Unit>: el tipo de retorno requerido por Mediator v3 para IRequest sin genérico.
public class DeleteCompanyCommandHandler : IRequestHandler<DeleteCompanyCommand>
{
    private readonly ICompanyRepository _repo;

    public DeleteCompanyCommandHandler(ICompanyRepository repo)
    {
        _repo = repo;
    }

    public async ValueTask<Unit> Handle(DeleteCompanyCommand request, CancellationToken cancellationToken)
    {
        await _repo.DeleteAsync(request.CompanyId);
        return Unit.Value;
    }
}
