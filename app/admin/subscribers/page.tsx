import type { Metadata } from "next";
import {
  getSubscribers,
  getMessages,
  deleteSubscriber,
  deleteMessage,
} from "../actions";
import DeleteInline from "@/components/admin/DeleteInline";

export const metadata: Metadata = {
  title: "Subscribers & Messages",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SubscribersPage() {
  const [subscribers, messages] = await Promise.all([
    getSubscribers(),
    getMessages(),
  ]);

  return (
    <div className="mx-auto max-w-container px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="font-heading text-[30px] font-extrabold tracking-[-0.02em] text-text">
          Subscribers &amp; Messages
        </h1>
        <p className="mt-1 font-body text-[15px] text-muted">
          {subscribers.length} newsletter subscriber
          {subscribers.length === 1 ? "" : "s"} · {messages.length} contact
          message{messages.length === 1 ? "" : "s"}.
        </p>
      </div>

      {/* Contact messages */}
      <section className="mb-10 overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-[16px] font-bold text-text">
            Contact messages
          </h2>
        </div>

        {messages.length === 0 ? (
          <p className="px-6 py-10 text-center font-body text-[15px] text-muted">
            No messages yet. Submissions from the Contact form appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className="px-6 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-heading text-[15px] font-bold text-text">
                      {m.name ?? "Anonymous"}
                    </span>
                    <a
                      href={`mailto:${m.email}`}
                      className="font-heading text-[13px] text-accent hover:text-accent-strong"
                    >
                      {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-[12.5px] text-muted">
                      {formatDate(m.created_at)}
                    </span>
                    <DeleteInline
                      action={async () => {
                        "use server";
                        await deleteMessage(m.id);
                      }}
                      confirmText={`Delete this message from ${m.email}?`}
                    />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-body text-[14.5px] leading-[1.6] text-text">
                  {m.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Newsletter subscribers */}
      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-token transition-theme">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-[16px] font-bold text-text">
            Newsletter subscribers
          </h2>
        </div>

        {subscribers.length === 0 ? (
          <p className="px-6 py-10 text-center font-body text-[15px] text-muted">
            No subscribers yet. Newsletter sign-ups appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border font-heading text-[12px] uppercase tracking-[0.04em] text-muted">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Subscribed</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3.5">
                      <a
                        href={`mailto:${s.email}`}
                        className="font-heading text-[14px] font-semibold text-text hover:text-accent"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-6 py-3.5 font-body text-[14px] text-muted">
                      {s.name ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 font-heading text-[13px] text-muted">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <DeleteInline
                        action={async () => {
                          "use server";
                          await deleteSubscriber(s.id);
                        }}
                        confirmText={`Remove ${s.email} from the list?`}
                        label="Remove"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
