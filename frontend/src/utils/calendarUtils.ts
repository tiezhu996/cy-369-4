import type { Campsite, Booking, MaintenanceRecord, DayCampsiteStatus, CampsiteStatus } from "../types";

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    d.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
}

export function getCampsiteStatusForDate(
    date: string,
    campsite: Campsite,
    bookings: Booking[],
    maintenanceRecords: MaintenanceRecord[]
): DayCampsiteStatus {
    const maintenance = maintenanceRecords.find(
        (m) => m.campsiteId === campsite.id && isDateInRange(date, m.startDate, m.endDate) && m.status !== "completed"
    );

    if (maintenance) {
        return {
            campsiteId: campsite.id,
            campsiteName: campsite.name,
            status: "maintenance",
            maintenanceId: maintenance.id,
            maintenanceReason: maintenance.reason,
        };
    }

    const booking = bookings.find(
        (b) => b.campsiteId === campsite.id && isDateInRange(date, b.checkInDate, b.checkOutDate) && b.status !== "cancelled"
    );

    if (booking) {
        return {
            campsiteId: campsite.id,
            campsiteName: campsite.name,
            status: "occupied",
            bookingId: booking.id,
            customerName: booking.customerName,
        };
    }

    return {
        campsiteId: campsite.id,
        campsiteName: campsite.name,
        status: "available",
    };
}

export function getAllCampsiteStatusesForDate(
    date: string,
    campsites: Campsite[],
    bookings: Booking[],
    maintenanceRecords: MaintenanceRecord[]
): DayCampsiteStatus[] {
    return campsites.map((campsite) =>
        getCampsiteStatusForDate(date, campsite, bookings, maintenanceRecords)
    );
}

export function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(firstDay);
        d.setDate(d.getDate() - i - 1);
        days.push(d);
    }

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        const d = new Date(lastDay);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    return days;
}

export function formatDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function getStatusColor(status: CampsiteStatus): string {
    switch (status) {
        case "available":
            return "#52c41a";
        case "occupied":
            return "#b14f3b";
        case "maintenance":
            return "#faad14";
        default:
            return "#d9d9d9";
    }
}

export function getStatusText(status: CampsiteStatus): string {
    switch (status) {
        case "available":
            return "空闲";
        case "occupied":
            return "已占";
        case "maintenance":
            return "维修";
        default:
            return "未知";
    }
}

export function isCampsiteAvailableForBooking(
    campsiteId: string,
    checkInDate: string,
    checkOutDate: string,
    bookings: Booking[],
    maintenanceRecords: MaintenanceRecord[]
): { available: boolean; reason?: string } {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    for (let d = new Date(checkIn); d <= checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateKey(d);

        const maintenance = maintenanceRecords.find(
            (m) => m.campsiteId === campsiteId && isDateInRange(dateStr, m.startDate, m.endDate) && m.status !== "completed"
        );

        if (maintenance) {
            return {
                available: false,
                reason: `该营位在 ${dateStr} 处于维修状态：${maintenance.reason}`,
            };
        }

        const booking = bookings.find(
            (b) => b.campsiteId === campsiteId && isDateInRange(dateStr, b.checkInDate, b.checkOutDate) && b.status !== "cancelled"
        );

        if (booking) {
            return {
                available: false,
                reason: `该营位在 ${dateStr} 已被 ${booking.customerName} 预约`,
            };
        }
    }

    return { available: true };
}
