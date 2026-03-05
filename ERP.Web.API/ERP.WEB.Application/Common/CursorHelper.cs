using System.Text;

namespace ERP.WEB.Application.Common;

// Codifica/decodifica el cursor en Base64 del ID (int).
// Base64 es URL-safe-friendly y opaco para el cliente.
public static class CursorHelper
{
    public static string Encode(int id) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(id.ToString()));

    public static int? Decode(string? cursor)
    {
        if (string.IsNullOrEmpty(cursor)) return null;
        try
        {
            var str = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            return int.TryParse(str, out var id) ? id : null;
        }
        catch
        {
            // Cursor inválido o manipulado → tratar como primer página.
            return null;
        }
    }
}
