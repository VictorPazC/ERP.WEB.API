namespace ERP.WEB.Domain.Enums;

// Roles válidos del sistema (Decisión 3A — role matrix fija).
// El valor se almacena como string en DB (columna User.Role) — sin migración.
// FluentValidation (FASE 3) ya valida que los DTOs usen estos valores exactos.
public enum UserRole
{
    SuperAdmin,
    Admin,
    Viewer
}
