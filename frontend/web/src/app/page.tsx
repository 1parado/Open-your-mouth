import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppHeader } from "@/components/app/app-header";
import { teacherProfiles } from "@/lib/teachers";

export default function Home() {
  return (
    <AuthGuard>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 md:px-10">
        <AppHeader />

        <section className="mb-6 mt-2">
          <p className="text-sm font-medium text-slate-500">选择老师</p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {teacherProfiles.map((teacher) => (
            <Link
              key={teacher.slug}
              href={`/teachers/${teacher.slug}`}
              className="group overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                <img
                  src={teacher.imageSrc}
                  alt={teacher.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-black/8 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h2 className="text-2xl font-semibold">{teacher.name}</h2>
                  <p className="mt-1 text-sm text-white/84">{teacher.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </AuthGuard>
  );
}
