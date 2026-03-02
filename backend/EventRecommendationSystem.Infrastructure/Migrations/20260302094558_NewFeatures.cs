using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventRecommendationSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NewFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorScheme",
                table: "Groups",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAnonymous",
                table: "Decisions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlindVoting",
                table: "Decisions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorScheme",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "IsAnonymous",
                table: "Decisions");

            migrationBuilder.DropColumn(
                name: "IsBlindVoting",
                table: "Decisions");
        }
    }
}
