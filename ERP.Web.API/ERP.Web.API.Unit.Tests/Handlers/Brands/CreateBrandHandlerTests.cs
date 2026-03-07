using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Brands.Commands.CreateBrand;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Unit.Tests.Handlers.Brands;

public class CreateBrandHandlerTests
{
    private readonly IBrandRepository _repo = Substitute.For<IBrandRepository>();
    private readonly CreateBrandCommandHandler _sut;

    public CreateBrandHandlerTests()
    {
        _sut = new CreateBrandCommandHandler(_repo);
    }

    [Fact]
    public async Task Handle_CreatesAndReturnsBrandDto()
    {
        var dto = new CreateBrandDto("Acme", "Description");
        var brand = new Brand { BrandId = 1, Name = "Acme", Description = "Description", IsDefault = false };

        _repo.AddAsync(Arg.Any<Brand>()).Returns(Task.FromResult(brand));

        var result = await _sut.Handle(new CreateBrandCommand(dto), CancellationToken.None);

        result.BrandId.Should().Be(1);
        result.Name.Should().Be("Acme");
        result.Description.Should().Be("Description");
        result.IsDefault.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_ProductsCountIsAlwaysZero()
    {
        var dto = new CreateBrandDto("X", null);
        var brand = new Brand { BrandId = 5, Name = "X" };

        _repo.AddAsync(Arg.Any<Brand>()).Returns(Task.FromResult(brand));

        var result = await _sut.Handle(new CreateBrandCommand(dto), CancellationToken.None);

        result.ProductsCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CallsAddAsyncExactlyOnce()
    {
        var dto = new CreateBrandDto("Y", null);
        _repo.AddAsync(Arg.Any<Brand>()).Returns(Task.FromResult(new Brand { BrandId = 1, Name = "Y" }));

        await _sut.Handle(new CreateBrandCommand(dto), CancellationToken.None);

        await _repo.Received(1).AddAsync(Arg.Is<Brand>(b => b.Name == "Y"));
    }
}
