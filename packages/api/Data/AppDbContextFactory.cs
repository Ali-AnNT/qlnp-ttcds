using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace QLNP.Api.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext> {
    public AppDbContext CreateDbContext(string[] args) {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer("Server=192.168.1.13,1439;Database=VI_NGHIPHEP;User Id=vietinfo;Password=Vietinfo@#@!;TrustServerCertificate=True");
        return new AppDbContext(optionsBuilder.Options);
    }
}
