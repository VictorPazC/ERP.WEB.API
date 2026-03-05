using ERP.WEB.Application.DTOs;
using Mediator;

namespace ERP.WEB.Application.Features.Users.Commands.SeedSuperAdmin;

public record SeedSuperAdminCommand(SeedSuperAdminDto Dto) : IRequest<UserDto?>;
