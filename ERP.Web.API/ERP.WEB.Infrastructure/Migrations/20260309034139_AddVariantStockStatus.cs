using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP.WEB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantStockStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StockStatus",
                table: "ProductVariants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StockStatus",
                table: "ProductVariants");
        }
    }
}
