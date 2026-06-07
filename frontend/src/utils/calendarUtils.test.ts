import { describe, it, expect } from "vitest";
import {
    formatLocalDate,
    parseLocalDate,
    isDateInBookingRange,
    isDateInMaintenanceRange,
    getCampsiteStatusForDate,
    isCampsiteAvailableForBooking,
    formatDateKey,
} from "../utils/calendarUtils";
import type { Campsite, Booking, MaintenanceRecord } from "../types";

const testCampsite: Campsite = {
    id: "test-001",
    name: "测试营位",
    type: "tent",
    area: 25,
    facilities: ["电源", "水源"],
    basePrice: 128,
    imageUrl: "test",
};

describe("日期工具函数", () => {
    describe("formatLocalDate", () => {
        it("应该正确格式化本地日期为YYYY-MM-DD格式", () => {
            const date = new Date(2026, 5, 7);
            expect(formatLocalDate(date)).toBe("2026-06-07");
        });

        it("应该正确处理月份和日期的补零", () => {
            const date = new Date(2026, 0, 1);
            expect(formatLocalDate(date)).toBe("2026-01-01");
        });
    });

    describe("parseLocalDate", () => {
        it("应该正确解析YYYY-MM-DD格式的日期字符串", () => {
            const date = parseLocalDate("2026-06-07");
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(5);
            expect(date.getDate()).toBe(7);
        });

        it("解析的日期应该是本地时间0点", () => {
            const date = parseLocalDate("2026-06-07");
            expect(date.getHours()).toBe(0);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(0);
        });
    });

    describe("formatDateKey", () => {
        it("formatDateKey应该与formatLocalDate行为一致", () => {
            const date = new Date(2026, 5, 7);
            expect(formatDateKey(date)).toBe(formatLocalDate(date));
        });

        it("不会因时区偏移导致日期错误", () => {
            const date = new Date(2026, 5, 7, 23, 30, 0);
            expect(formatDateKey(date)).toBe("2026-06-07");
        });
    });

    describe("isDateInBookingRange", () => {
        it("入住日应该计算在内", () => {
            expect(isDateInBookingRange("2026-06-10", "2026-06-10", "2026-06-15")).toBe(true);
        });

        it("退房日不应该计算在内 - 修复退房日误占用问题", () => {
            expect(isDateInBookingRange("2026-06-15", "2026-06-10", "2026-06-15")).toBe(false);
        });

        it("入住期间的日期应该计算在内", () => {
            expect(isDateInBookingRange("2026-06-12", "2026-06-10", "2026-06-15")).toBe(true);
        });

        it("入住前的日期不应该计算在内", () => {
            expect(isDateInBookingRange("2026-06-09", "2026-06-10", "2026-06-15")).toBe(false);
        });

        it("一天的预订（入住=退房）应该不占用任何日期", () => {
            expect(isDateInBookingRange("2026-06-10", "2026-06-10", "2026-06-10")).toBe(false);
        });
    });

    describe("isDateInMaintenanceRange", () => {
        it("维修开始日应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-10", "2026-06-10", "2026-06-15")).toBe(true);
        });

        it("维修结束日应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-15", "2026-06-10", "2026-06-15")).toBe(true);
        });

        it("维修期间的日期应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-12", "2026-06-10", "2026-06-15")).toBe(true);
        });

        it("维修开始前的日期不应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-09", "2026-06-10", "2026-06-15")).toBe(false);
        });

        it("维修结束后的日期不应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-16", "2026-06-10", "2026-06-15")).toBe(false);
        });

        it("一天的维修应该计算在内", () => {
            expect(isDateInMaintenanceRange("2026-06-10", "2026-06-10", "2026-06-10")).toBe(true);
        });
    });
});

describe("营位状态计算", () => {
    const bookings: Booking[] = [
        {
            id: "bk-001",
            campsiteId: "test-001",
            customerName: "张三",
            phone: "138****1234",
            checkInDate: "2026-06-10",
            checkOutDate: "2026-06-15",
            guestCount: 2,
            totalPrice: 1280,
            status: "confirmed",
        },
    ];

    const maintenanceRecords: MaintenanceRecord[] = [
        {
            id: "mt-001",
            campsiteId: "test-001",
            startDate: "2026-06-20",
            endDate: "2026-06-22",
            reason: "设施检修",
            status: "scheduled",
        },
    ];

    describe("getCampsiteStatusForDate", () => {
        it("没有预订和维修时应该返回空闲状态", () => {
            const status = getCampsiteStatusForDate("2026-06-01", testCampsite, [], []);
            expect(status.status).toBe("available");
            expect(status.campsiteId).toBe("test-001");
        });

        it("入住日应该显示为已占用", () => {
            const status = getCampsiteStatusForDate("2026-06-10", testCampsite, bookings, []);
            expect(status.status).toBe("occupied");
            expect(status.customerName).toBe("张三");
        });

        it("入住期间应该显示为已占用", () => {
            const status = getCampsiteStatusForDate("2026-06-12", testCampsite, bookings, []);
            expect(status.status).toBe("occupied");
        });

        it("退房日应该显示为空闲 - 修复退房日误占用", () => {
            const status = getCampsiteStatusForDate("2026-06-15", testCampsite, bookings, []);
            expect(status.status).toBe("available");
        });

        it("维修开始日应该显示为维修中", () => {
            const status = getCampsiteStatusForDate("2026-06-20", testCampsite, [], maintenanceRecords);
            expect(status.status).toBe("maintenance");
            expect(status.maintenanceReason).toBe("设施检修");
        });

        it("维修结束日应该显示为维修中", () => {
            const status = getCampsiteStatusForDate("2026-06-22", testCampsite, [], maintenanceRecords);
            expect(status.status).toBe("maintenance");
        });

        it("维修优先级应该高于预订", () => {
            const overlappingMaintenance: MaintenanceRecord[] = [
                {
                    id: "mt-002",
                    campsiteId: "test-001",
                    startDate: "2026-06-12",
                    endDate: "2026-06-13",
                    reason: "紧急维修",
                    status: "in_progress",
                },
            ];
            const status = getCampsiteStatusForDate("2026-06-12", testCampsite, bookings, overlappingMaintenance);
            expect(status.status).toBe("maintenance");
        });

        it("已完成的维修不应该影响状态", () => {
            const completedMaintenance: MaintenanceRecord[] = [
                {
                    ...maintenanceRecords[0],
                    status: "completed",
                },
            ];
            const status = getCampsiteStatusForDate("2026-06-20", testCampsite, [], completedMaintenance);
            expect(status.status).toBe("available");
        });

        it("已取消的预订不应该影响状态", () => {
            const cancelledBooking: Booking[] = [
                {
                    ...bookings[0],
                    status: "cancelled",
                },
            ];
            const status = getCampsiteStatusForDate("2026-06-12", testCampsite, cancelledBooking, []);
            expect(status.status).toBe("available");
        });
    });

    describe("isCampsiteAvailableForBooking", () => {
        it("完全空闲的时段应该可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-01",
                "2026-06-05",
                [],
                []
            );
            expect(result.available).toBe(true);
        });

        it("与现有预订部分重叠应该不可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-14",
                "2026-06-18",
                bookings,
                []
            );
            expect(result.available).toBe(false);
            expect(result.reason).toContain("张三");
        });

        it("与现有预订完全重叠应该不可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-11",
                "2026-06-14",
                bookings,
                []
            );
            expect(result.available).toBe(false);
        });

        it("从他人退房日开始入住应该可以预约 - 修复退房日冲突", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-15",
                "2026-06-18",
                bookings,
                []
            );
            expect(result.available).toBe(true);
        });

        it("与维修时段重叠应该不可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-21",
                "2026-06-25",
                [],
                maintenanceRecords
            );
            expect(result.available).toBe(false);
            expect(result.reason).toContain("设施检修");
        });

        it("维修完成后的日期应该可以预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-23",
                "2026-06-25",
                [],
                maintenanceRecords
            );
            expect(result.available).toBe(true);
        });

        it("维修开始日当天不可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-20",
                "2026-06-21",
                [],
                maintenanceRecords
            );
            expect(result.available).toBe(false);
        });

        it("维修结束日当天不可预约", () => {
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-22",
                "2026-06-23",
                [],
                maintenanceRecords
            );
            expect(result.available).toBe(false);
        });

        it("已完成的维修不应该影响预约", () => {
            const completedMaintenance: MaintenanceRecord[] = [
                {
                    ...maintenanceRecords[0],
                    status: "completed",
                },
            ];
            const result = isCampsiteAvailableForBooking(
                "test-001",
                "2026-06-20",
                "2026-06-23",
                [],
                completedMaintenance
            );
            expect(result.available).toBe(true);
        });
    });
});

describe("多营位状态场景测试", () => {
    const campsites: Campsite[] = [
        { ...testCampsite, id: "c-01", name: "营位A" },
        { ...testCampsite, id: "c-02", name: "营位B" },
    ];

    const bookings: Booking[] = [
        {
            id: "bk-1",
            campsiteId: "c-01",
            customerName: "客户A",
            phone: "138****0001",
            checkInDate: "2026-07-01",
            checkOutDate: "2026-07-05",
            guestCount: 2,
            totalPrice: 1000,
            status: "confirmed",
        },
        {
            id: "bk-2",
            campsiteId: "c-02",
            customerName: "客户B",
            phone: "138****0002",
            checkInDate: "2026-07-03",
            checkOutDate: "2026-07-06",
            guestCount: 3,
            totalPrice: 1500,
            status: "confirmed",
        },
    ];

    it("连续预订场景：前一个退房日是后一个入住日应该可行", () => {
        const result1 = isCampsiteAvailableForBooking("c-01", "2026-07-01", "2026-07-05", bookings, []);
        expect(result1.available).toBe(false);

        const result2 = isCampsiteAvailableForBooking("c-01", "2026-07-05", "2026-07-08", bookings, []);
        expect(result2.available).toBe(true);
    });

    it("不同营位的预订不互相影响", () => {
        const result = isCampsiteAvailableForBooking("c-01", "2026-07-03", "2026-07-06", bookings, []);
        expect(result.available).toBe(false);

        const result2 = isCampsiteAvailableForBooking("c-01", "2026-07-06", "2026-07-08", bookings, []);
        expect(result2.available).toBe(true);
    });
});
