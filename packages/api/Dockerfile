# Use the official .NET 10 SDK image as a build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the csproj file and restore dependencies
COPY ["QLNP.Api.csproj", "."]
RUN dotnet restore "./QLNP.Api.csproj"

# Copy the rest of the application code
COPY . .

# Build and publish the application
RUN dotnet publish "./QLNP.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 10 ASP.NET Core runtime image as the final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port the app runs on
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "QLNP.Api.dll"]
