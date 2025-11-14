"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndReservations() {
      try {
        const resUser = await fetch("/api/me", { credentials: "include" });

        if (!resUser.ok) {
          router.push("/login");
          return;
        }

        const userData = await resUser.json();
        setUser(userData.user);

        const response = await fetch(
          `/api/reservation?user_id=${userData.user.id}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndReservations();
  }, [router]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        My Reservations
      </h1>

      {reservations.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No reservations found.
        </p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">
                  Room Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">
                  Room number
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">
                  Email / Phone
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                  Check-in
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                  Check-out
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                  Guests
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold uppercase">
                  Total (€)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {reservations.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {r.rooms?.name || "Unnamed Room"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium text-center">
                    {r.rooms?.room_number || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {r.full_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{r.users?.email}</span>
                      <span className="text-sm text-gray-500">{r.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-green-500 font-semibold">
                    {new Date(r.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-red-500 font-semibold">
                    {new Date(r.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">{r.guests}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        r.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : r.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : r.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    €{Number(r.total_price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 text-sm">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
