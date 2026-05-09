const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = ["8a", "11a", "2p", "5p"];
const values = [3, 6, 4, 9, 8, 2, 1, 5, 7, 10, 6, 3, 4, 9, 11, 7, 6, 4, 2, 1, 3, 5, 8, 4, 2, 1, 0, 1];

export function ActivityHeatmap() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-2 text-xs text-muted-foreground">
        <div />
        {days.map((day) => <div key={day}>{day}</div>)}
      </div>
      {hours.map((hour, row) => (
        <div key={hour} className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-2">
          <div className="text-xs text-muted-foreground">{hour}</div>
          {days.map((day, col) => {
            const value = values[row * days.length + col] ?? 0;
            return (
              <div
                key={`${hour}-${day}`}
                className="h-9 rounded-md border"
                style={{ backgroundColor: `rgba(20, 184, 166, ${0.08 + value / 18})` }}
                title={`${day} ${hour}: ${value} interactions`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
