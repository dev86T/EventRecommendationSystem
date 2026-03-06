FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY . .
RUN dotnet publish EventRecommendationSystem.API/EventRecommendationSystem.API.csproj \
    -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .

# Применяем миграции и запускаем
ENTRYPOINT ["dotnet", "EventRecommendationSystem.API.dll"]