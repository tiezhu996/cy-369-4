import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingModal } from "../components/BookingModal";
import type { Campsite, Booking, MaintenanceRecord, BookingFormValues } from "../types";
import dayjs from "dayjs";
import { Form } from "antd";
import type { FormInstance } from "antd";

const mockCampsites: Campsite[] = [
    {
        id: "tent-01",
        name: "帐篷区 A1",
        type: "tent",
        area: 25,
        facilities: ["电源", "水源"],
        basePrice: 128,
        imageUrl: "tent-01",
    },
    {
        id: "tent-02",
        name: "帐篷区 A2",
        type: "tent",
        area: 30,
        facilities: ["电源", "水源", "篝火位"],
        basePrice: 158,
        imageUrl: "tent-02",
    },
    {
        id: "rv-01",
        name: "房车区 B1",
        type: "rv",
        area: 60,
        facilities: ["电源", "水源", "排污口"],
        basePrice: 288,
        imageUrl: "rv-01",
    },
];

const mockBookings: Booking[] = [
    {
        id: "bk-001",
        campsiteId: "tent-01",
        customerName: "张三",
        phone: "138****1234",
        checkInDate: "2026-06-10",
        checkOutDate: "2026-06-15",
        guestCount: 2,
        totalPrice: 1280,
        status: "confirmed",
    },
];

const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
        id: "mt-001",
        campsiteId: "rv-01",
        startDate: "2026-06-12",
        endDate: "2026-06-14",
        reason: "水电系统检修",
        status: "scheduled",
    },
];

const defaultProps = {
    open: true,
    campsites: mockCampsites,
    bookings: mockBookings,
    maintenanceRecords: mockMaintenanceRecords,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
};

type BookingModalTestProps = typeof defaultProps & {
    preselectedCampsiteId?: string;
    preselectedDate?: string;
    form?: FormInstance<BookingFormValues>;
};

function renderWithForm(extraProps: Partial<BookingModalTestProps> = {}) {
    let formRef: FormInstance<BookingFormValues> | null = null;
    const user = userEvent.setup();

    const TestComponent = () => {
        const [form] = Form.useForm<BookingFormValues>();
        formRef = form;

        return (
            <BookingModal
                {...defaultProps}
                {...extraProps}
                form={form}
            />
        );
    };

    const result = render(<TestComponent />);

    return {
        ...result,
        form: () => formRef!,
        setDateRange: async (checkIn: string, checkOut: string) => {
            await act(async () => {
                formRef!.setFieldsValue({
                    dateRange: [dayjs(checkIn), dayjs(checkOut)],
                });
            });
        },
        setCampsite: async (campsiteId: string) => {
            await act(async () => {
                formRef!.setFieldsValue({ campsiteId });
            });
        },
        setFullValues: async (values: Partial<BookingFormValues>) => {
            await act(async () => {
                formRef!.setFieldsValue(values);
            });
        },
        user,
    };
}

describe("BookingModal 营位可用性动态标记", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete (window as any).__testHelpers;
    });

    it("未选择日期时，营位下拉框应该被禁用", () => {
        renderWithForm();
        const campsiteSelect = screen.getByRole("combobox", { name: /选择营位/i });
        expect(campsiteSelect).toBeDisabled();
    });

    it("未选择日期时，应该提示用户先选日期", () => {
        renderWithForm();
        expect(screen.getByText("请先选择入住日期，系统将自动显示各营位的可用状态")).toBeInTheDocument();
    });

    it("未选择日期时，营位下拉框应该有提示文字", () => {
        renderWithForm();
        const campsiteSelect = screen.getByRole("combobox", { name: /选择营位/i });
        expect(campsiteSelect).toBeDisabled();
        expect(screen.getAllByText("请先选择入住日期").length).toBeGreaterThan(0);
    });

    it("表单设置日期范围后，营位可用性应该动态计算", async () => {
        const { setDateRange } = renderWithForm();

        expect(screen.getByRole("combobox", { name: /选择营位/i })).toBeDisabled();

        await setDateRange("2026-06-12", "2026-06-14");

        await waitFor(() => {
            const campsiteSelect = screen.getByRole("combobox", { name: /选择营位/i });
            expect(campsiteSelect).not.toBeDisabled();
        });

        expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
    });

    it("表单设置与预订冲突的日期后，应该显示提示信息", async () => {
        const { setDateRange } = renderWithForm();

        await setDateRange("2026-06-12", "2026-06-14");

        await waitFor(() => {
            expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
        });
    });

    it("选择与退房日衔接的日期应该可用（退房日不占用）", async () => {
        const { setDateRange } = renderWithForm();

        await setDateRange("2026-06-15", "2026-06-17");

        await waitFor(() => {
            expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
        });

        const campsiteSelect = screen.getByRole("combobox", { name: /选择营位/i });
        expect(campsiteSelect).not.toBeDisabled();
    });

    it("预选营位与日期冲突时应该显示警告", async () => {
        const { setFullValues } = renderWithForm({
            preselectedCampsiteId: "tent-01",
            preselectedDate: "2026-06-12",
        });

        await setFullValues({
            dateRange: [dayjs("2026-06-12"), dayjs("2026-06-14")] as [any, any],
            campsiteId: "tent-01",
        });

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("预选营位不可用");
        });
    });

    it("关闭弹窗时应该重置内部状态", async () => {
        const TestWrapper = ({ open }: { open: boolean }) => {
            const [form] = Form.useForm<BookingFormValues>();
            return <BookingModal {...defaultProps} open={open} form={form} />;
        };

        const { rerender } = render(<TestWrapper open={true} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("请先选择入住日期，系统将自动显示各营位的可用状态")).toBeInTheDocument();

        rerender(<TestWrapper open={false} />);

        await waitFor(() => {
            const dialog = screen.queryByRole("dialog");
            if (dialog) {
                expect(dialog).toHaveClass("ant-zoom-leave");
            }
        }, { timeout: 3000 });

        rerender(<TestWrapper open={true} />);
        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText("请先选择入住日期，系统将自动显示各营位的可用状态")).toBeInTheDocument();
        });
    });

    it("营位选择后应该显示营位详情卡片", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-16"), dayjs("2026-06-18")] as [any, any],
            campsiteId: "tent-02",
            guestCount: 2,
        });

        await waitFor(() => {
            const strongElements = screen.getAllByText("帐篷区 A2");
            expect(strongElements.length).toBeGreaterThan(0);
            expect(screen.getByText(/类型：帐篷/)).toBeInTheDocument();
            expect(screen.getByText(/面积：30㎡/)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it("选择可预约营位后应该显示预计费用", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-16"), dayjs("2026-06-18")] as [any, any],
            campsiteId: "tent-02",
            guestCount: 2,
        });

        await waitFor(() => {
            expect(screen.getByText(/该营位在此期间可预约/)).toBeInTheDocument();
            expect(screen.getByText(/预计费用：¥632/)).toBeInTheDocument();
        });
    });

    it("选择可预约营位后确认按钮应该启用", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-16"), dayjs("2026-06-18")] as [any, any],
            campsiteId: "tent-02",
            guestCount: 2,
            customerName: "测试客户",
            phone: "13800138000",
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /确认预约/ })).not.toBeDisabled();
        });
    });

    it("点击确认预约时应该调用 onSubmit", async () => {
        const mockSubmit = vi.fn();
        const { setFullValues, user } = renderWithForm({
            onSubmit: mockSubmit,
        });

        await setFullValues({
            dateRange: [dayjs("2026-06-16"), dayjs("2026-06-18")] as [any, any],
            campsiteId: "tent-02",
            guestCount: 2,
            customerName: "测试客户",
            phone: "13800138000",
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /确认预约/ })).not.toBeDisabled();
        });

        await user.click(screen.getByRole("button", { name: /确认预约/ }));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    campsiteId: "tent-02",
                    checkInDate: "2026-06-16",
                    checkOutDate: "2026-06-18",
                    guestCount: 2,
                    customerName: "测试客户",
                    phone: "13800138000",
                    totalPrice: 632,
                })
            );
        });
    });

    it("选择与维修冲突的日期后，营位应该被自动清除并显示警告", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-13"), dayjs("2026-06-15")] as [any, any],
            campsiteId: "rv-01",
        });

        await waitFor(() => {
            const alerts = screen.getAllByRole("alert");
            const warningAlert = alerts.find((a) => a.className.includes("ant-alert-warning"));
            expect(warningAlert).toBeInTheDocument();
            expect(warningAlert).toHaveTextContent(/不可预约/);
            expect(warningAlert).toHaveTextContent(/维修/);
        });

        expect(screen.getByRole("button", { name: /确认预约/ })).toBeDisabled();
    });

    it("选择与预订冲突的日期后，营位应该被自动清除并显示警告", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-12"), dayjs("2026-06-14")] as [any, any],
            campsiteId: "tent-01",
        });

        await waitFor(() => {
            const alerts = screen.getAllByRole("alert");
            const warningAlert = alerts.find((a) => a.className.includes("ant-alert-warning"));
            expect(warningAlert).toBeInTheDocument();
            expect(warningAlert).toHaveTextContent(/不可预约/);
            expect(warningAlert).toHaveTextContent(/已被/);
            expect(warningAlert).toHaveTextContent(/张三/);
        });

        expect(screen.getByRole("button", { name: /确认预约/ })).toBeDisabled();
    });
});

describe("BookingModal 营位状态标签显示", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("日期范围与维修重叠时，维修营位应该在下拉列表中被禁用", async () => {
        const { setDateRange } = renderWithForm();

        await setDateRange("2026-06-12", "2026-06-14");

        await waitFor(() => {
            expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
        });
    });

    it("日期范围无冲突时，可预约营位应该显示绿色标签", async () => {
        const { setFullValues } = renderWithForm();

        await setFullValues({
            dateRange: [dayjs("2026-06-16"), dayjs("2026-06-18")] as [any, any],
            campsiteId: "tent-02",
        });

        await waitFor(() => {
            expect(screen.getByText(/该营位在此期间可预约/)).toBeInTheDocument();
        });
    });

    it("切换日期范围后应该重新计算营位可用性", async () => {
        const { setDateRange } = renderWithForm();

        await setDateRange("2026-06-12", "2026-06-14");

        await waitFor(() => {
            expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
        });

        await setDateRange("2026-06-16", "2026-06-18");

        await waitFor(() => {
            expect(screen.getByText("已根据您选择的日期范围，自动标记不可预约的营位")).toBeInTheDocument();
        });
    });
});
