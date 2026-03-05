using Mediator;

namespace ERP.WEB.Application.Features.Companies.Commands.DeleteCompany;

// Command sin retorno (IRequest sin tipo genérico) — eliminar no produce datos.
// Mismo patrón que DeleteBrandCommand, DeleteCategoryCommand, etc.
public record DeleteCompanyCommand(int CompanyId) : IRequest;
