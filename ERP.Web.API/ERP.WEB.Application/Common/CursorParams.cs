namespace ERP.WEB.Application.Common;

// Parámetros de entrada para paginación cursor-based (Decisión 2B).
// Cursor es el ID del último ítem visto, codificado en Base64.
// PageSize por defecto 20; el repositorio pide PageSize+1 para detectar HasMore.
public record CursorParams(string? Cursor = null, int PageSize = 20);
