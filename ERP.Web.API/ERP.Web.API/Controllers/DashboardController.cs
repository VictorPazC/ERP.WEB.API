using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Dashboard.Queries.GetActivity;
using ERP.WEB.Application.Features.Dashboard.Queries.GetTopProducts;
using ERP.WEB.Application.Features.Dashboard.Queries.GetWeeklyStats;
using ERP.WEB.Application.Features.Inventory.Queries.GetCriticalInventory;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator) => _mediator = mediator;

    /// <summary>Ganancias y pedidos agrupados por día para los últimos N días.</summary>
    [HttpGet("weekly-stats")]
    public async Task<ActionResult<IEnumerable<WeeklyStatDto>>> GetWeeklyStats(
        [FromQuery] int days = 7)
    {
        var result = await _mediator.Send(new GetWeeklyStatsQuery(days));
        return Ok(result);
    }

    /// <summary>Últimos N eventos de actividad del tenant.</summary>
    [HttpGet("activity")]
    public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetActivity(
        [FromQuery] int limit = 10)
    {
        var result = await _mediator.Send(new GetActivityQuery(limit));
        return Ok(result);
    }

    /// <summary>Top N productos por métrica: revenue | units | consumptions.</summary>
    [HttpGet("top-products")]
    public async Task<ActionResult<IEnumerable<TopProductDto>>> GetTopProducts(
        [FromQuery] int limit = 5,
        [FromQuery] string metric = "revenue")
    {
        var result = await _mediator.Send(new GetTopProductsQuery(limit, metric));
        return Ok(result);
    }

    /// <summary>Items de inventario con stock menor o igual al umbral dado.</summary>
    [HttpGet("critical-inventory")]
    public async Task<ActionResult<IEnumerable<CriticalInventoryDto>>> GetCriticalInventory(
        [FromQuery] int threshold = 5)
    {
        var result = await _mediator.Send(new GetCriticalInventoryQuery(threshold));
        return Ok(result);
    }
}
