using ERP.WEB.Application.Common;
using ERP.WEB.Application.DTOs;
using ERP.WEB.Application.Features.Brands.Commands.CreateBrand;
using ERP.WEB.Application.Features.Brands.Commands.DeleteBrand;
using ERP.WEB.Application.Features.Brands.Commands.SetDefaultBrand;
using ERP.WEB.Application.Features.Brands.Commands.UpdateBrand;
using ERP.WEB.Application.Features.Brands.Queries.GetAllBrands;
using ERP.WEB.Application.Features.Brands.Queries.GetBrandById;
using ERP.WEB.Domain.Common;
using ERP.Web.API.Controllers;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ERP.Web.API.Unit.Tests.Controllers;

public class BrandsControllerTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly ILogger<BrandsController> _logger = Substitute.For<ILogger<BrandsController>>();
    private readonly BrandsController _sut;

    private static BrandDto SampleBrand(int id = 1) =>
        new(id, "Test Brand", "Desc", 0, false);

    private static CursorPagedResult<BrandDto> PagedResult(BrandDto dto) =>
        new(new[] { dto }, null, false);

    public BrandsControllerTests()
    {
        _sut = new BrandsController(_mediator, _logger);
    }

    // ── GetAll ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200WithResult()
    {
        var paged = PagedResult(SampleBrand());
        _mediator.Send(Arg.Any<GetAllBrandsQuery>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<CursorPagedResult<BrandDto>>(paged));

        var action = await _sut.GetAll(null, 20);

        var ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(paged);
    }

    // ── GetById ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_Returns200()
    {
        var dto = SampleBrand();
        _mediator.Send(Arg.Any<GetBrandByIdQuery>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<BrandDto?>(dto));

        var action = await _sut.GetById(1);

        action.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_WhenNotFound_Returns404()
    {
        _mediator.Send(Arg.Any<GetBrandByIdQuery>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<BrandDto?>((BrandDto?)null));

        var action = await _sut.GetById(999);

        action.Result.Should().BeOfType<NotFoundResult>();
    }

    // ── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201CreatedAtAction()
    {
        var dto = SampleBrand();
        _mediator.Send(Arg.Any<CreateBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<BrandDto>(dto));

        var action = await _sut.Create(new CreateBrandDto("Test Brand", "Desc"));

        var created = action.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.StatusCode.Should().Be(201);
        created.Value.Should().Be(dto);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_WhenIdMismatch_Returns400WithoutCallingMediator()
    {
        var action = await _sut.Update(1, new UpdateBrandDto(99, "X", null));

        action.Result.Should().BeOfType<BadRequestResult>();
        await _mediator.DidNotReceive().Send(Arg.Any<UpdateBrandCommand>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_WhenFound_Returns200()
    {
        var dto = SampleBrand();
        _mediator.Send(Arg.Any<UpdateBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<BrandDto?>(dto));

        var action = await _sut.Update(1, new UpdateBrandDto(1, "Test Brand", null));

        action.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Update_WhenNotFound_Returns404()
    {
        _mediator.Send(Arg.Any<UpdateBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<BrandDto?>((BrandDto?)null));

        var action = await _sut.Update(1, new UpdateBrandDto(1, "X", null));

        action.Result.Should().BeOfType<NotFoundResult>();
    }

    // ── SetDefault ───────────────────────────────────────────────────────────

    [Fact]
    public async Task SetDefault_WhenFound_Returns204()
    {
        _mediator.Send(Arg.Any<SetDefaultBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<bool>(true));

        var action = await _sut.SetDefault(1);

        action.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task SetDefault_WhenNotFound_Returns404()
    {
        _mediator.Send(Arg.Any<SetDefaultBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<bool>(false));

        var action = await _sut.SetDefault(999);

        action.Should().BeOfType<NotFoundResult>();
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenFound_Returns204()
    {
        _mediator.Send(Arg.Any<DeleteBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<bool>(true));

        var action = await _sut.Delete(1);

        action.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Delete_WhenNotFound_Returns404()
    {
        _mediator.Send(Arg.Any<DeleteBrandCommand>(), Arg.Any<CancellationToken>())
                 .Returns(new ValueTask<bool>(false));

        var action = await _sut.Delete(999);

        action.Should().BeOfType<NotFoundResult>();
    }
}
