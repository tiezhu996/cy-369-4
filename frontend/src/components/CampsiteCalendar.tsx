import { useState, useMemo } from "react";
import { Button, Card, Badge, Space, Typography } from "antd";
import { LeftOutlined, RightOutlined, PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import type { Campsite, Booking, MaintenanceRecord, DayCampsiteStatus } from "../types";
import {
    getDaysInMonth,
    formatDateKey,
    getAllCampsiteStatusesForDate,
    getStatusColor,
    getStatusText,
} from "../utils/calendarUtils";
import { DayDetailModal } from "./DayDetailModal";
import { BookingModal } from "./BookingModal";

interface CampsiteCalendarProps {
    campsites: Campsite[];
    bookings: Booking[];
    maintenanceRecords: MaintenanceRecord[];
    onAddBooking?: (booking: Omit<Booking, "id" | "status">) => void;
}

const WEEK_DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function CampsiteCalendar({ campsites, bookings, maintenanceRecords, onAddBooking }: CampsiteCalendarProps) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [preselectedCampsiteId, setPreselectedCampsiteId] = useState<string | undefined>();
    const [preselectedDate, setPreselectedDate] = useState<string | undefined>();

    const calendarDays = useMemo(
        () => getDaysInMonth(currentYear, currentMonth),
        [currentYear, currentMonth]
    );

    const isCurrentMonth = (date: Date) =>
        date.getMonth() === currentMonth && date.getFullYear() === currentYear;

    const isToday = (date: Date) => {
        const t = new Date();
        return (
            date.getDate() === t.getDate() &&
            date.getMonth() === t.getMonth() &&
            date.getFullYear() === t.getFullYear()
        );
    };

    const getDayStatuses = (date: Date): DayCampsiteStatus[] => {
        const dateKey = formatDateKey(date);
        return getAllCampsiteStatusesForDate(dateKey, campsites, bookings, maintenanceRecords);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDayClick = (date: Date) => {
        const dateKey = formatDateKey(date);
        setSelectedDate(dateKey);
        setDayModalOpen(true);
    };

    const handleBookCampsite = (campsiteId: string, date: string) => {
        setDayModalOpen(false);
        setPreselectedCampsiteId(campsiteId);
        setPreselectedDate(date);
        setBookingModalOpen(true);
    };

    const handleAddBookingClick = () => {
        setPreselectedCampsiteId(undefined);
        setPreselectedDate(undefined);
        setBookingModalOpen(true);
    };

    const handleBookingSubmit = (booking: Omit<Booking, "id" | "status">) => {
        onAddBooking?.(booking);
        setBookingModalOpen(false);
    };

    const selectedDateStatuses = selectedDate
        ? getAllCampsiteStatusesForDate(selectedDate, campsites, bookings, maintenanceRecords)
        : [];

    const renderStatusDots = (statuses: DayCampsiteStatus[]) => {
        const counts = {
            available: statuses.filter((s) => s.status === "available").length,
            occupied: statuses.filter((s) => s.status === "occupied").length,
            maintenance: statuses.filter((s) => s.status === "maintenance").length,
        };

        return (
            <div className="status-dots">
                {counts.available > 0 && (
                    <Badge
                        count={counts.available}
                        style={{ backgroundColor: getStatusColor("available"), color: "#fff" }}
                        title={`${counts.available} 个${getStatusText("available")}`}
                    />
                )}
                {counts.occupied > 0 && (
                    <Badge
                        count={counts.occupied}
                        style={{ backgroundColor: getStatusColor("occupied"), color: "#fff" }}
                        title={`${counts.occupied} 个${getStatusText("occupied")}`}
                    />
                )}
                {counts.maintenance > 0 && (
                    <Badge
                        count={counts.maintenance}
                        style={{ backgroundColor: getStatusColor("maintenance"), color: "#fff" }}
                        title={`${counts.maintenance} 个${getStatusText("maintenance")}`}
                    />
                )}
            </div>
        );
    };

    return (
        <Card
            className="campsite-calendar"
            title={
                <Space>
                    <CalendarOutlined />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        营位占用日历
                    </Typography.Title>
                </Space>
            }
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBookingClick}>
                    新增预约
                </Button>
            }
        >
            <div className="calendar-header">
                <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
                <Typography.Title level={4} style={{ margin: 0 }}>
                    {currentYear}年{currentMonth + 1}月
                </Typography.Title>
                <Button icon={<RightOutlined />} onClick={handleNextMonth} />
            </div>

            <div className="calendar-legend">
                <Space>
                    <span>
                        <Badge color={getStatusColor("available")} /> 空闲
                    </span>
                    <span>
                        <Badge color={getStatusColor("occupied")} /> 已占
                    </span>
                    <span>
                        <Badge color={getStatusColor("maintenance")} /> 维修
                    </span>
                </Space>
            </div>

            <div className="calendar-weekdays">
                {WEEK_DAYS.map((day) => (
                    <div key={day} className="weekday-cell">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">
                {calendarDays.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const inCurrentMonth = isCurrentMonth(date);
                    const isTodayDate = isToday(date);
                    const dayStatuses = getDayStatuses(date);

                    return (
                        <div
                            key={index}
                            className={`calendar-day ${inCurrentMonth ? "" : "other-month"} ${isTodayDate ? "today" : ""}`}
                            onClick={() => inCurrentMonth && handleDayClick(date)}
                        >
                            <div className="day-number">{date.getDate()}</div>
                            {inCurrentMonth && renderStatusDots(dayStatuses)}
                        </div>
                    );
                })}
            </div>

            <DayDetailModal
                open={dayModalOpen}
                date={selectedDate || ""}
                campsiteStatuses={selectedDateStatuses}
                onClose={() => setDayModalOpen(false)}
                onBookCampsite={handleBookCampsite}
            />

            <BookingModal
                open={bookingModalOpen}
                campsites={campsites}
                bookings={bookings}
                maintenanceRecords={maintenanceRecords}
                preselectedCampsiteId={preselectedCampsiteId}
                preselectedDate={preselectedDate}
                onClose={() => setBookingModalOpen(false)}
                onSubmit={handleBookingSubmit}
            />
        </Card>
    );
}
