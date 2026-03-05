namespace ERP.WEB.Application.Common;

// Respuesta de un endpoint paginado cursor-based.
// Items: página actual (máximo PageSize elementos).
// NextCursor: cursor para pedir la siguiente página (null si no hay más).
// HasMore: indica explícitamente si quedan más páginas.
public record CursorPagedResult<T>(IEnumerable<T> Items, string? NextCursor, bool HasMore);
