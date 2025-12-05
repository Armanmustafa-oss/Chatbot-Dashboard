import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";

export default function Students() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: students, isLoading } = trpc.students.list.useQuery({
    limit,
    offset: page * limit,
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            View all students who have interacted with the chatbot
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            className="neu-flat pl-10 pr-4 py-2 rounded-xl text-sm w-64 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading students...
        </div>
      ) : !students || students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No students found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <NeuCard key={student.id} className="hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {student.name || `Student ${student.studentId}`}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {student.email || "No email"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {student.department && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {student.department}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last active: {formatDate(student.lastActiveAt)}
                    </p>
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="neu-flat border-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={students.length < limit}
              className="neu-flat border-0"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
