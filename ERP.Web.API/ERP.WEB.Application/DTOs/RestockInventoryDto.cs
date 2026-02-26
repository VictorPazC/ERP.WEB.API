namespace ERP.WEB.Application.DTOs;

public record RestockInventoryDto(
    int AdditionalStock,
    bool NeedsRestock
);
