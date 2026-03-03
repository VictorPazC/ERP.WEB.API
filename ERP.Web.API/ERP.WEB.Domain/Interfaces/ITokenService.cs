using ERP.WEB.Domain.Entities;

namespace ERP.WEB.Domain.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
