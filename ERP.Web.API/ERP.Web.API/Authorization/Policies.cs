namespace ERP.Web.API.Authorization;

// Nombres de políticas de autorización (Decisión 3A).
// Admin  → Admin + SuperAdmin: endpoints de escritura (POST, PUT, PATCH, DELETE).
// Viewer → Viewer + Admin + SuperAdmin: endpoints de lectura (GET).
// Los valores en DB (User.Role) deben coincidir con UserRole enum: "SuperAdmin", "Admin", "Viewer".
public static class Policies
{
    public const string Admin  = "Admin";
    public const string Viewer = "Viewer";
}
