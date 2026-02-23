namespace ERP.WEB.Application.DTOs;

public record TagDto(
    int TagId,
    string TagName,
    int ProductsCount
);
