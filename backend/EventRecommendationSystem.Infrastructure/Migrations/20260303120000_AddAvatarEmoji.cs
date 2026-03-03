using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventRecommendationSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarEmoji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarEmoji",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "🐱");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarEmoji",
                table: "Users");
        }
    }
}
