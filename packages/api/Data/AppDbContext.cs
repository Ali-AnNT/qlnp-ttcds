using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
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
    public DbSet<LeaveType> LeaveTypes { get; set; }
    public DbSet<LeaveBalance> LeaveBalances { get; set; }
    public DbSet<LeaveRequest> LeaveRequests { get; set; }
    public DbSet<LeaveConfig> LeaveConfigs { get; set; }
    public DbSet<LeaveRequestAudit> LeaveRequestAudits { get; set; }

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
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.ApprovedLevel).HasDefaultValue(0);
        });

        modelBuilder.Entity<LeaveConfig>(entity =>
        {
            entity.HasOne(e => e.LeaveType)
                .WithMany(lt => lt.Configs)
                .HasForeignKey(e => e.LeaveTypeId);
            entity.ToTable(t => t.HasCheckConstraint("CK_LeaveConfig_ApprovalLevel", "ApprovalLevel >= 1"));
        });

        modelBuilder.Entity<LeaveRequestAudit>(entity =>
        {
            entity.HasIndex(e => e.LeaveRequestId);
            entity.HasOne(e => e.LeaveRequest)
                .WithMany(lr => lr.Audits)
                .HasForeignKey(e => e.LeaveRequestId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ChangedByUser)
                .WithMany()
                .HasForeignKey(e => e.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // ---- Seed data ----

        modelBuilder.Entity<LeaveType>().HasData(
            new LeaveType { Id = 1, Name = "Nghỉ phép năm", Code = "NPN", DefaultDays = 12, Description = "Nghỉ phép năm theo quy định", IsActive = true },
            new LeaveType { Id = 2, Name = "Nghỉ ốm", Code = "NO", DefaultDays = 30, Description = "Nghỉ ốm đau có giấy xác nhận", IsActive = true },
            new LeaveType { Id = 3, Name = "Nghỉ việc riêng", Code = "NVR", DefaultDays = 3, Description = "Nghỉ việc riêng có lương", IsActive = true },
            new LeaveType { Id = 4, Name = "Nghỉ không lương", Code = "NKL", DefaultDays = 0, Description = "Nghỉ không hưởng lương", IsActive = true },
            new LeaveType { Id = 5, Name = "Nghỉ thai sản", Code = "NTS", DefaultDays = 180, Description = "Nghỉ thai sản", IsActive = true }
        );

        // Initial baseline only — runtime updates via Config/Update endpoint (ReplaceAllAsync) will replace these rows
        modelBuilder.Entity<LeaveConfig>().HasData(
            new LeaveConfig { Id = 1, LeaveTypeId = 1, ApprovalLevel = 1, ApproverRole = AppRoles.Leader },
            new LeaveConfig { Id = 2, LeaveTypeId = 1, ApprovalLevel = 2, ApproverRole = AppRoles.Director },
            new LeaveConfig { Id = 3, LeaveTypeId = 2, ApprovalLevel = 1, ApproverRole = AppRoles.Leader },
            new LeaveConfig { Id = 4, LeaveTypeId = 2, ApprovalLevel = 2, ApproverRole = AppRoles.Director },
            new LeaveConfig { Id = 5, LeaveTypeId = 3, ApprovalLevel = 1, ApproverRole = AppRoles.Leader },
            new LeaveConfig { Id = 6, LeaveTypeId = 3, ApprovalLevel = 2, ApproverRole = AppRoles.Director },
            new LeaveConfig { Id = 7, LeaveTypeId = 4, ApprovalLevel = 1, ApproverRole = AppRoles.Leader },
            new LeaveConfig { Id = 8, LeaveTypeId = 5, ApprovalLevel = 1, ApproverRole = AppRoles.Leader },
            new LeaveConfig { Id = 9, LeaveTypeId = 5, ApprovalLevel = 2, ApproverRole = AppRoles.Director }
        );

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
