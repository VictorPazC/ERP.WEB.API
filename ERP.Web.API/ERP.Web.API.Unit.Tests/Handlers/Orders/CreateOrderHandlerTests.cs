using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Orders.Commands.CreateOrder;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Unit.Tests.Handlers.Orders;

public class CreateOrderHandlerTests
{
    private readonly IOrderRepository _repo = Substitute.For<IOrderRepository>();
    private readonly IActivityLogger  _activityLogger = Substitute.For<IActivityLogger>();
    private readonly CreateOrderCommandHandler _sut;

    public CreateOrderHandlerTests()
    {
        _sut = new CreateOrderCommandHandler(_repo, _activityLogger);

        // Default: return the order passed in, with an auto-assigned ID
        _repo.AddAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>())
             .Returns(c =>
             {
                 var o = c.Arg<Order>();
                 o.OrderId = 1;
                 o.CreatedAt = DateTime.UtcNow;
                 // Give each item an ID
                 for (var i = 0; i < o.Items.Count; i++) o.Items[i].OrderItemId = i + 1;
                 return Task.FromResult(o);
             });
    }

    [Fact]
    public async Task Handle_CalculatesCorrectTotalAmount()
    {
        var dto = new CreateOrderDto("note", new List<CreateOrderItemDto>
        {
            new(InventoryId: 1, Quantity: 2, UnitPrice: 10.00m),
            new(InventoryId: 2, Quantity: 3, UnitPrice: 5.00m),
        });

        var result = await _sut.Handle(new CreateOrderCommand(dto), CancellationToken.None);

        result.TotalAmount.Should().Be(35.00m); // 2*10 + 3*5
    }

    [Fact]
    public async Task Handle_NewOrder_HasDraftStatus()
    {
        var dto = new CreateOrderDto(null, new List<CreateOrderItemDto>
        {
            new(InventoryId: 1, Quantity: 1, UnitPrice: 9.99m),
        });

        var result = await _sut.Handle(new CreateOrderCommand(dto), CancellationToken.None);

        result.Status.Should().Be("Draft");
    }

    [Fact]
    public async Task Handle_MapsItemsCorrectly()
    {
        var dto = new CreateOrderDto(null, new List<CreateOrderItemDto>
        {
            new(InventoryId: 7, Quantity: 4, UnitPrice: 2.50m),
        });

        var result = await _sut.Handle(new CreateOrderCommand(dto), CancellationToken.None);

        result.Items.Should().HaveCount(1);
        var item = result.Items[0];
        item.InventoryId.Should().Be(7);
        item.Quantity.Should().Be(4);
        item.UnitPrice.Should().Be(2.50m);
        item.Subtotal.Should().Be(10.00m);
    }
}
