using Mapster;
using Microsoft.Extensions.DependencyInjection;

namespace ERP.WEB.Application;

/// <summary>
/// Centraliza la configuración global de Mapster.
/// Registrar en Program.cs via builder.Services.AddMapsterConfig().
///
/// Uso en handlers (solo donde no hay lógica embebida en el mapeo):
///     var dto = entity.Adapt&lt;XxxDto&gt;();
///     var list = entities.Adapt&lt;List&lt;XxxDto&gt;&gt;();
///
/// Los handlers que tienen campos computados (ej. BrandDto.ProductCount = Products.Count,
/// InventoryDto.Margin = SuggestedRetailPrice - PurchaseCost) siguen usando
/// proyecciones manuales — no reemplazar con Adapt en esos casos.
/// </summary>
public static class MapsterConfig
{
    public static IServiceCollection AddMapsterConfig(this IServiceCollection services)
    {
        var config = TypeAdapterConfig.GlobalSettings;

        // Configuración global: coincidencia por nombre (case-insensitive), nullable-aware.
        config.Default
            .NameMatchingStrategy(NameMatchingStrategy.Flexible)
            .PreserveReference(true);

        // Scan de todas las IRegister en el ensamblado (para mapeos custom futuros).
        config.Scan(typeof(MapsterConfig).Assembly);

        return services;
    }
}
