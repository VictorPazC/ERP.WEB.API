namespace ERP.WEB.Domain.Enums;

/// <summary>
/// Valores válidos para Product.StockStatus.
/// La columna en DB se mantiene como string — este enum se usa solo para validación en la capa de aplicación.
/// FASE 3 (FluentValidation) complementará esta validación a nivel de request DTO.
/// </summary>
public enum StockStatus
{
    InStock,
    LowStock,
    OutOfStock
}
