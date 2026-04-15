import { useState } from "react";
import { LeaveBalanceCard } from "@/components/LeaveBalanceCard";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { LeaveHistory } from "@/components/LeaveHistory";
import { initialBalances, sampleRequests, LeaveRequest } from "@/lib/leave-data";
import { CalendarDays } from "lucide-react";

const Index = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(sampleRequests);

  const handleNewRequest = (request: LeaveRequest) => {
    setRequests((prev) => [request, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary">
            <CalendarDays className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quản lý nghỉ phép</h1>
            <p className="text-sm text-muted-foreground">Theo dõi và quản lý ngày phép của bạn</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Balance cards */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Tổng quan ngày phép</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {initialBalances.map((b) => (
              <LeaveBalanceCard key={b.type} balance={b} />
            ))}
          </div>
        </section>

        {/* Form + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <LeaveRequestForm onSubmit={handleNewRequest} />
          </div>
          <div className="lg:col-span-2">
            <LeaveHistory requests={requests} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
