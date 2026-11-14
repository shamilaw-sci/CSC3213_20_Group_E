import { Calendar, ChevronRight } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

export default function AppointmentsPanel({ appointments, onFindAgent, onViewAgent, onCancel, onMessage }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scheduled Viewings & Agent Appointments</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track your booked property tours, consultations, and agent confirmation statuses</p>
                </div>
                <button
                    type="button"
                    onClick={() => onFindAgent()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto cursor-pointer"
                >
                    <span>Find & Book Certified Agent</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {appointments.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No scheduled appointments yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Browse certified agents or property listings to book personalized in-person site tours or video consultations.
                    </p>
                    <button
                        type="button"
                        onClick={() => onFindAgent()}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                    >
                        Explore Certified Agents
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {appointments.map((appt) => (
                        <AppointmentCard
                            key={appt.lead_id}
                            appointment={appt}
                            onViewAgent={onViewAgent}
                            onCancel={onCancel}
                            onMessage={onMessage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
