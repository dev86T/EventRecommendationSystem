using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventRecommendationSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NewFeaturesUiUx : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorScheme",
                table: "Groups");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorScheme",
                table: "Groups",
                type: "text",
                nullable: true);
        }
    }
}
