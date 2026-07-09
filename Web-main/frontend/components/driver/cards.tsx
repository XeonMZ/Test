export function DriverStatusCard({ status = 'offline' }: { status?: string }) { return <div className="rounded-xl border p-4"><p className="text-sm text-slate-500">Driver Status</p><h2 className="text-2xl font-semibold capitalize">{status.replace('_', ' ')}</h2></div>; }
export function CurrentShiftCard() { return <div className="rounded-xl border p-4"><p className="text-sm text-slate-500">Current Shift</p><h2 className="text-xl font-semibold">Ready for today&apos;s operation</h2></div>; }
export function TodayTrips() { return <div className="rounded-xl border p-4"><p className="text-sm text-slate-500">Today&apos;s Trips</p><h2 className="text-xl font-semibold">Assigned trips and next departure</h2></div>; }
export function TripTimeline() { return <div className="rounded-xl border p-4"><p className="text-sm text-slate-500">Trip Timeline</p><ol className="list-decimal pl-5"><li>Driver Assigned</li><li>Driver Accepted</li><li>Trip Finished</li></ol></div>; }
export function DriverMap() { return <div className="rounded-xl border bg-slate-100 p-8 text-center text-slate-600">DriverMap live tracking panel</div>; }
export function GpsIndicator() { return <div className="rounded-xl border p-4 text-emerald-600">GPS Active</div>; }
export function ShiftTimer() { return <div className="rounded-xl border p-4">ShiftTimer 00:00</div>; }
export function TripSummary() { return <div className="rounded-xl border p-4">TripSummary</div>; }
export function EarningsSummary() { return <div className="rounded-xl border p-4">EarningsSummary</div>; }
