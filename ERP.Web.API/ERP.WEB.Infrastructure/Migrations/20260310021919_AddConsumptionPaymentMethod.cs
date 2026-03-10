using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP.WEB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConsumptionPaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Consumptions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Consumptions");
        }
    }
}
