// Main calendar component used across the app
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// Passing in prop to handle date clicks depending on the screen used
export default function Calendar({
    handleDateClick,
    events,
    editable,
    onEventDrop,
    onEventClick,
}) {
    return (
        <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
            }}
            height="auto"
            events={events}
            editable={!!editable}
            eventDisplay="block"
            dateClick={(info) => {
                if (handleDateClick) handleDateClick(info);
            }} // Check if prop exists before calling it just in case I dont define it
            eventDrop={(info) => {
                if (onEventDrop) onEventDrop(info);
            }}
            eventClick={(info) => {
                if (onEventClick) onEventClick(info);
            }}
            // Native tooltip fallback so the full event text is always available on hover
            eventDidMount={(info) => {
                info.el.title = info.event.title.replace(/\n/g, " - ");
            }}
        />
    );
}
