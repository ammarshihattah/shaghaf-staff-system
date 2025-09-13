import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import arEG from 'date-fns/locale/ar-EG';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Booking } from '../../types';

const locales = {
  'ar-EG': arEG,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingCalendarProps {
  bookings: Booking[];
  onSelectDate?: (date: Date) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings, onSelectDate }) => {
  const events = bookings.map(booking => ({
    title: `${booking.client?.name} - ${booking.room?.name}`,
    start: new Date(booking.start_time),
    end: new Date(booking.end_time),
    allDay: false,
    resource: booking, // Store the full booking object if needed
  }));

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    if (onSelectDate) {
      onSelectDate(slotInfo.start);
    }
  };

  const handleSelectEvent = (event: any) => {
    if (onSelectDate) {
      onSelectDate(event.start);
    }
  };

  const handleNavigate = (newDate: Date) => {
    // Handle navigation if needed in the future
  };

  const handleView = (view: any) => {
    // Handle view change if needed in the future  
  };
  return (
    <div style={{ height: 700 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        culture="ar-EG"
        selectable={true}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigate}
        onView={handleView}
        messages={{
          next: 'التالي',
          previous: 'السابق',
          today: 'اليوم',
          month: 'شهر',
          week: 'أسبوع',
          day: 'يوم',
          agenda: 'أجندة',
          date: 'التاريخ',
          time: 'الوقت',
          event: 'الحدث',
          noEventsInRange: 'لا توجد أحداث في هذا النطاق.',
          showMore: (total) => `+ عرض المزيد (${total})`,
        }}
        eventPropGetter={(event, start, end, isSelected) => {
          let newStyle = {
            backgroundColor: '#3B82F6', // Default blue
            color: 'white',
            borderRadius: '0px',
            border: 'none',
            cursor: 'pointer',
          };

          if (event.resource.status === 'cancelled') {
            newStyle.backgroundColor = '#EF4444'; // Red for cancelled
          } else if (event.resource.status === 'completed') {
            newStyle.backgroundColor = '#10B981'; // Green for completed
          }

          return {
            className: '',
            style: newStyle
          };
        }}
        dayPropGetter={(date) => {
          return {
            className: 'cursor-pointer hover:bg-gray-100',
            style: {
              cursor: 'pointer'
            }
          };
        }}
      />
    </div>
  );
};

export default BookingCalendar;