using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP.WEB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleInventoryLotsPerProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inventory_ProductId",
                table: "Inventory");

            migrationBuilder.DropIndex(
                name: "IX_Inventory_VariantId",
                table: "Inventory");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ProductId",
                table: "Inventory",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_VariantId",
                table: "Inventory",
                column: "VariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inventory_ProductId",
                table: "Inventory");

            migrationBuilder.DropIndex(
                name: "IX_Inventory_VariantId",
                table: "Inventory");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ProductId",
                table: "Inventory",
                column: "ProductId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_VariantId",
                table: "Inventory",
                column: "VariantId",
                unique: true,
                filter: "[VariantId] IS NOT NULL");
        }
    }
}
