using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Orders.Commands.CancelOrder;
using ERP.WEB.Application.Features.Orders.Commands.ConfirmOrder;
using ERP.WEB.Application.Features.Orders.Commands.CreateOrder;
using ERP.WEB.Application.Features.Orders.Commands.DeleteOrder;
using ERP.WEB.Application.Features.Orders.Queries.GetAllOrders;
using ERP.WEB.Application.Features.Orders.Queries.GetOrderById;
using ERP.Web.API.Authorization;
using Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.Web.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger   = logger;
    }

    [HttpGet]
    public async Task<ActionResult<CursorPagedResult<OrderDto>>> GetAll(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20)
    {
        _logger.LogDebug("[DEBUG] GetAll orders cursor={Cursor} pageSize={PageSize}", cursor, pageSize);
        var result = await _mediator.Send(new GetAllOrdersQuery(new CursorParams(cursor, pageSize)));
        _logger.LogInformation("[INFO]  Returned {Count} orders hasMore={HasMore}", result.Items.Count(), result.HasMore);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        _logger.LogDebug("[DEBUG] GetById order id={Id}", id);
        var result = await _mediator.Send(new GetOrderByIdQuery(id));
        if (result is null)
        {
            _logger.LogWarning("[WARN]  Order id={Id} not found", id);
            return NotFound();
        }
        return Ok(result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderDto dto)
    {
        _logger.LogInformation("[INFO]  Creating order items={Count}", dto.Items.Count);
        var result = await _mediator.Send(new CreateOrderCommand(dto));
        _logger.LogInformation("[INFO]  Order created id={Id} total={Total}", result.OrderId, result.TotalAmount);
        return CreatedAtAction(nameof(GetById), new { id = result.OrderId }, result);
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost("{id}/confirm")]
    public async Task<ActionResult> Confirm(int id)
    {
        _logger.LogInformation("[INFO]  Confirming order id={Id}", id);
        var result = await _mediator.Send(new ConfirmOrderCommand(id));
        if (!result)
        {
            _logger.LogWarning("[WARN]  Order id={Id}: not found, not Draft, or insufficient stock", id);
            return BadRequest(new { message = "Order not found, not in Draft status, or insufficient stock for one or more items." });
        }
        _logger.LogInformation("[INFO]  Order id={Id} confirmed — stock reduced", id);
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> Cancel(int id)
    {
        _logger.LogInformation("[INFO]  Cancelling order id={Id}", id);
        var result = await _mediator.Send(new CancelOrderCommand(id));
        if (!result)
        {
            _logger.LogWarning("[WARN]  Order id={Id} not found or already cancelled", id);
            return BadRequest(new { message = "Order not found or already cancelled." });
        }
        _logger.LogInformation("[INFO]  Order id={Id} cancelled", id);
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        _logger.LogInformation("[INFO]  Deleting order id={Id}", id);
        var result = await _mediator.Send(new DeleteOrderCommand(id));
        if (!result)
        {
            _logger.LogWarning("[WARN]  Order id={Id} not found or not in Draft status", id);
            return BadRequest(new { message = "Order not found or cannot be deleted (only Draft orders can be deleted)." });
        }
        _logger.LogInformation("[INFO]  Order id={Id} deleted", id);
        return NoContent();
    }
}
