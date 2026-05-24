# ── Build stage ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore (cached if unchanged)
COPY Domain/Domain.csproj           Domain/
COPY Infrastructure/Infrastructure.csproj Infrastructure/
COPY WebApi/WebApi.csproj           WebApi/
RUN dotnet restore WebApi/WebApi.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish WebApi/WebApi.csproj -c Release -o /app --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create uploads folder (used locally; on Render with Cloudinary it's empty but harmless)
RUN mkdir -p wwwroot/uploads

COPY --from=build /app .

# Render injects PORT; default to 8080 for local Docker runs
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

ENTRYPOINT ["dotnet", "WebApi.dll"]
