using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP.WEB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLowStockThreshold : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "Inventory",
                type: "int",
                nullable: false,
                defaultValue: 5);

            // Seed existing rows with the default threshold of 5
            migrationBuilder.Sql("UPDATE [Inventory] SET [LowStockThreshold] = 5 WHERE [LowStockThreshold] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "Inventory");
        }
    }
}
