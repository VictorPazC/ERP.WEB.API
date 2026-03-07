using ERP.WEB.Application.Common;
using ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;
using ERP.WEB.Domain.Common;
using ERP.WEB.Domain.Entities;
using ERP.WEB.Domain.Interfaces;

namespace ERP.Web.API.Unit.Tests.Handlers.Brands;

public class GetAllBrandsHandlerTests
{
    private readonly IBrandRepository _repo = Substitute.For<IBrandRepository>();
    private readonly GetAllBrandsQueryHandler _sut;

    public GetAllBrandsHandlerTests()
    {
        _sut = new GetAllBrandsQueryHandler(_repo);
    }

    [Fact]
    public async Task Handle_WhenResultsFitInPage_HasMoreFalse()
    {
        var brands = Enumerable.Range(1, 3).Select(i => new Brand { BrandId = i, Name = $"Brand{i}" }).ToList();
        _repo.GetAllAsync(Arg.Any<CursorParams>(), Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(brands));

        var result = await _sut.Handle(new GetAllBrandsQuery(new CursorParams(null, 20)), CancellationToken.None);

        result.HasMore.Should().BeFalse();
        result.NextCursor.Should().BeNull();
        result.Items.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_WhenExtraItem_HasMoreTrueAndCursorSet()
    {
        // Repository returns pageSize + 1 items (21 for pageSize=20)
        var brands = Enumerable.Range(1, 21).Select(i => new Brand { BrandId = i, Name = $"Brand{i}" }).ToList();
        _repo.GetAllAsync(Arg.Any<CursorParams>(), Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(brands));

        var result = await _sut.Handle(new GetAllBrandsQuery(new CursorParams(null, 20)), CancellationToken.None);

        result.HasMore.Should().BeTrue();
        result.NextCursor.Should().NotBeNull();
        result.Items.Should().HaveCount(20);
    }

    [Fact]
    public async Task Handle_WhenEmpty_ReturnsEmptyResult()
    {
        _repo.GetAllAsync(Arg.Any<CursorParams>(), Arg.Any<CancellationToken>())
             .Returns(Task.FromResult(new List<Brand>()));

        var result = await _sut.Handle(new GetAllBrandsQuery(new CursorParams(null, 20)), CancellationToken.None);

        result.HasMore.Should().BeFalse();
        result.NextCursor.Should().BeNull();
        result.Items.Should().BeEmpty();
    }
}
