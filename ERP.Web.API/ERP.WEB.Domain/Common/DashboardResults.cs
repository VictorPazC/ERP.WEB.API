namespace ERP.WEB.Domain.Common;

public record WeeklyStatResult(DateTime Day, decimal Ganancia, int Pedidos);

public record TopProductResult(int ProductId, string ProductName, decimal Value);
