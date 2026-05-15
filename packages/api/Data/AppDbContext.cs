using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Entities;

namespace QLNP.Api.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // System tables (scaffolded, excluded from migrations)
    public virtual DbSet<DmDonvi> DmDonvi { get; set; }
    public virtual DbSet<UserMaster> UserMaster { get; set; }

    // QLNP tables (Code First)
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<LeaveType> LeaveTypes { get; set; }
    public DbSet<LeaveBalance> LeaveBalances { get; set; }
    public DbSet<LeaveRequest> LeaveRequests { get; set; }
    public DbSet<LeaveConfig> LeaveConfigs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---- System tables (read-only, excluded from migrations) ----

        modelBuilder.Entity<DmDonvi>(entity =>
        {
            entity.HasKey(e => e.DonViId)
                .HasName("PK__DM_DONVI__1CB88576D84B4D4C")
                .IsClustered(false);

            entity.ToTable("DM_DONVI", t => t.ExcludeFromMigrations());

            entity.HasIndex(e => e.DonViCapChaId, "IDX_DM_DONVI_01");

            entity.Property(e => e.DonViId).HasColumnName("DonViID");
            entity.Property(e => e.CapDonViId).HasColumnName("CapDonViID");
            entity.Property(e => e.DiaChiDayDu).HasMaxLength(1000);
            entity.Property(e => e.DienThoai).HasMaxLength(50);
            entity.Property(e => e.DonViCapChaId).HasColumnName("DonViCapChaID");
            entity.Property(e => e.DuongId).HasColumnName("DuongID");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.Fax).HasMaxLength(50);
            entity.Property(e => e.Latitude).HasMaxLength(20);
            entity.Property(e => e.LoaiDonViId).HasColumnName("LoaiDonViID");
            entity.Property(e => e.Longitude).HasMaxLength(20);
            entity.Property(e => e.MaDonVi).HasMaxLength(20);
            entity.Property(e => e.MoTa).HasMaxLength(4000);
            entity.Property(e => e.PhuongXaId).HasColumnName("PhuongXaID");
            entity.Property(e => e.QuanHuyenId).HasColumnName("QuanHuyenID");
            entity.Property(e => e.SoNha).HasMaxLength(100);
            entity.Property(e => e.TenDonVi).HasMaxLength(2000);
            entity.Property(e => e.TenVietTat).HasMaxLength(100);
            entity.Property(e => e.TinhThanhId).HasColumnName("TinhThanhID");
            entity.Property(e => e.Website).HasMaxLength(100);
        });

        modelBuilder.Entity<UserMaster>(entity =>
        {
            entity.HasKey(e => e.UserMasterId).HasName("PK__USER_MAS__CA9BC5E270CE69C2");

            entity.ToTable("USER_MASTER", t => t.ExcludeFromMigrations());

            entity.HasIndex(e => new { e.DonViId, e.UserPortalId, e.Used }, "IDX_USER_MASTER_01");
            entity.HasIndex(e => e.UserPortalId, "IDX_USER_MASTER_02");
            entity.HasIndex(e => new { e.PhongBanId, e.DonViId, e.UserPortalId }, "IDX_USER_MASTER_03");
            entity.HasIndex(e => new { e.DonViId, e.UserPortalId }, "IDX_USER_MASTER_04");
            entity.HasIndex(e => e.UserPortalId, "IDX_USER_MASTER_05");
            entity.HasIndex(e => new { e.DonViId, e.UserPortalId }, "IDX_USER_MASTER_07");
            entity.HasIndex(e => new { e.CanBoId, e.Used }, "IX_USER_MASTER_CanBoID_Used");

            entity.Property(e => e.UserMasterId).HasColumnName("User_MasterID");
            entity.Property(e => e.CanBoId).HasColumnName("CanBoID");
            entity.Property(e => e.DonViId).HasColumnName("DonViID");
            entity.Property(e => e.HoTen).HasMaxLength(50);
            entity.Property(e => e.PhongBanId).HasColumnName("PhongBanID");
            entity.Property(e => e.UserName).HasMaxLength(50);
            entity.Property(e => e.UserPortalId).HasColumnName("User_PortalID");

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- QLNP tables (Code First) ----

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.Role).HasMaxLength(20);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId);
        });

        modelBuilder.Entity<LeaveType>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<LeaveBalance>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.LeaveTypeId, e.Year }).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.LeaveType)
                .WithMany(lt => lt.Balances)
                .HasForeignKey(e => e.LeaveTypeId);
        });

        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.LeaveType)
                .WithMany(lt => lt.Requests)
                .HasForeignKey(e => e.LeaveTypeId);
            entity.HasOne(e => e.Approver)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .IsRequired(false);
            entity.HasOne(e => e.RequestedApprover)
                .WithMany()
                .HasForeignKey(e => e.RequestedApproverId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<LeaveConfig>(entity =>
        {
            entity.HasOne(e => e.LeaveType)
                .WithMany(lt => lt.Configs)
                .HasForeignKey(e => e.LeaveTypeId);
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaveConfig_ApprovalLevel", "ApprovalLevel >= 1"));
        });

        // ---- Seed data ----

        modelBuilder.Entity<LeaveType>().HasData(
            new LeaveType { Id = 1, Name = "Nghỉ phép năm", Code = "annual", DefaultDays = 12, IsActive = true },
            new LeaveType { Id = 2, Name = "Ốm đau", Code = "sick", DefaultDays = 0, IsActive = true },
            new LeaveType { Id = 3, Name = "Việc riêng", Code = "personal", DefaultDays = 3, IsActive = true }
        );

        modelBuilder.Entity<UserRole>().HasData(
            new UserRole { UserId = 1, Role = "QLNP.QTHT" },
            new UserRole { UserId = 2, Role = "QLNP.CB.PCM" },
            new UserRole { UserId = 3, Role = "QLNP.LD.PCM" },
            new UserRole { UserId = 4, Role = "QLNP.GD.PGD" }
        );

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
