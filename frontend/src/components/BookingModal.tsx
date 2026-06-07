import { useState, useEffect, useMemo } from "react";
import { Modal, Form, Input, DatePicker, Select, InputNumber, Alert, Card, Tag } from "antd";
import type { Campsite, Booking, MaintenanceRecord, BookingFormValues } from "../types";
import { isCampsiteAvailableForBooking, formatLocalDate, isDateInMaintenanceRange } from "../utils/calendarUtils";
import dayjs from "dayjs";
import type { FormInstance } from "antd";

interface BookingModalProps {
    open: boolean;
    campsites: Campsite[];
    bookings: Booking[];
    maintenanceRecords: MaintenanceRecord[];
    preselectedCampsiteId?: string;
    preselectedDate?: string;
    onClose: () => void;
    onSubmit: (booking: Omit<Booking, "id" | "status">) => void;
    form?: FormInstance<BookingFormValues>;
}

export function BookingModal({
    open,
    campsites,
    bookings,
    maintenanceRecords,
    preselectedCampsiteId,
    preselectedDate,
    onClose,
    onSubmit,
    form: propForm,
}: BookingModalProps) {
    const [internalForm] = Form.useForm<BookingFormValues>();
    const form = propForm || internalForm;
    const [availabilityCheck, setAvailabilityCheck] = useState<{ available: boolean; reason?: string } | null>(null);
    const [conflictWarning, setConflictWarning] = useState<string | null>(null);

    const watchDateRange = Form.useWatch("dateRange", form);
    const watchCampsiteId = Form.useWatch("campsiteId", form);
    const watchGuestCount = Form.useWatch("guestCount", form);
    const watchCustomerName = Form.useWatch("customerName", form);
    const watchPhone = Form.useWatch("phone", form);

    const selectedCampsiteId = watchCampsiteId;

    const formValues = useMemo(() => {
        if (!watchDateRange && !watchCampsiteId && !watchGuestCount && !watchCustomerName && !watchPhone) {
            return null;
        }
        return {
            dateRange: watchDateRange,
            campsiteId: watchCampsiteId,
            guestCount: watchGuestCount,
            customerName: watchCustomerName,
            phone: watchPhone,
        } as BookingFormValues;
    }, [watchDateRange, watchCampsiteId, watchGuestCount, watchCustomerName, watchPhone]);

    const handleValuesChange = (_: Partial<BookingFormValues>, allValues: BookingFormValues) => {
        // Values are now tracked via useWatch
    };

    const todayStr = useMemo(() => formatLocalDate(new Date()), []);

    const campsiteAvailabilities = useMemo(() => {
        if (!formValues?.dateRange || !formValues.dateRange[0] || !formValues.dateRange[1]) {
            return null;
        }

        const checkIn = formValues.dateRange[0].format("YYYY-MM-DD");
        const checkOut = formValues.dateRange[1].format("YYYY-MM-DD");

        return campsites.reduce((acc, campsite) => {
            const check = isCampsiteAvailableForBooking(
                campsite.id,
                checkIn,
                checkOut,
                bookings,
                maintenanceRecords
            );
            acc[campsite.id] = check;
            return acc;
        }, {} as Record<string, { available: boolean; reason?: string }>);
    }, [formValues?.dateRange?.[0]?.valueOf(), formValues?.dateRange?.[1]?.valueOf(), campsites, bookings, maintenanceRecords]);

    useEffect(() => {
        if (open) {
            if (preselectedDate) {
                const date = dayjs(preselectedDate);
                setTimeout(() => form.setFieldsValue({ dateRange: [date, date.add(1, "day")] }), 0);
            }
            if (preselectedCampsiteId) {
                setTimeout(() => form.setFieldsValue({ campsiteId: preselectedCampsiteId }), 0);
            }
            setConflictWarning(null);
        } else {
            setAvailabilityCheck(null);
            setConflictWarning(null);
            form.resetFields();
        }
    }, [open, preselectedCampsiteId, preselectedDate, form]);

    useEffect(() => {
        if (campsiteAvailabilities && selectedCampsiteId) {
            const availability = campsiteAvailabilities[selectedCampsiteId];
            if (availability && !availability.available) {
                setConflictWarning(
                    `您预选的营位在所选日期范围内不可预约：${availability.reason}。请选择其他营位或调整日期。`
                );
                form.setFieldsValue({ campsiteId: undefined });
            } else {
                setConflictWarning(null);
            }
        }
    }, [campsiteAvailabilities, selectedCampsiteId, form]);

    useEffect(() => {
        if (formValues?.campsiteId && formValues?.dateRange && formValues.dateRange[0] && formValues.dateRange[1]) {
            const check = isCampsiteAvailableForBooking(
                formValues.campsiteId,
                formValues.dateRange[0].format("YYYY-MM-DD"),
                formValues.dateRange[1].format("YYYY-MM-DD"),
                bookings,
                maintenanceRecords
            );
            setAvailabilityCheck(check);
        } else {
            setAvailabilityCheck(null);
        }
    }, [formValues?.campsiteId, formValues?.dateRange?.[0]?.valueOf(), formValues?.dateRange?.[1]?.valueOf(), bookings, maintenanceRecords]);

    const campsiteOptions = useMemo(() => {
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return campsites.map((campsite) => {
            const availability = campsiteAvailabilities?.[campsite.id];

            if (availability && !availability.available) {
                const isMaintenance = availability.reason?.includes("维修");
                return {
                    label: (
                        <span style={{ opacity: 0.5 }}>
                            {campsite.name}
                            <Tag color={isMaintenance ? "orange" : "red"} style={{ marginLeft: 8 }}>
                                {isMaintenance ? "维修中" : "已占用"}
                            </Tag>
                            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                                {availability.reason}
                            </div>
                        </span>
                    ),
                    value: campsite.id,
                    disabled: true,
                };
            }

            const currentMaintenance = maintenanceRecords.find(
                (m) =>
                    m.campsiteId === campsite.id &&
                    m.status === "in_progress" &&
                    isDateInMaintenanceRange(todayStr, m.startDate, m.endDate)
            );

            const hasUpcomingMaintenance = maintenanceRecords.some(
                (m) => {
                    if (m.campsiteId !== campsite.id || m.status === "completed") return false;
                    const startDate = new Date(m.startDate);
                    return startDate >= todayDateOnly;
                }
            );

            return {
                label: (
                    <span>
                        {campsite.name}
                        {currentMaintenance && (
                            <Tag color="orange" style={{ marginLeft: 8 }}>
                                维修中
                            </Tag>
                        )}
                        {!currentMaintenance && hasUpcomingMaintenance && (
                            <Tag color="gold" style={{ marginLeft: 8 }}>
                                有维修计划
                            </Tag>
                        )}
                        {availability?.available && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                                可预约
                            </Tag>
                        )}
                    </span>
                ),
                value: campsite.id,
                disabled: false,
            };
        });
    }, [campsites, maintenanceRecords, todayStr, campsiteAvailabilities]);

    const selectedCampsite = campsites.find((c) => c.id === selectedCampsiteId);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (!availabilityCheck?.available) {
                return;
            }

            const nights = values.dateRange[1].diff(values.dateRange[0], "day");
            const totalPrice = (selectedCampsite?.basePrice || 0) * nights * values.guestCount;

            onSubmit({
                campsiteId: values.campsiteId,
                customerName: values.customerName,
                phone: values.phone,
                checkInDate: values.dateRange[0].format("YYYY-MM-DD"),
                checkOutDate: values.dateRange[1].format("YYYY-MM-DD"),
                guestCount: values.guestCount,
                totalPrice,
            });

            form.resetFields();
            setAvailabilityCheck(null);
        } catch {
            // Validation error
        }
    };

    return (
        <Modal
            title="营位预约"
            open={open}
            onCancel={() => {
                onClose();
                form.resetFields();
                setAvailabilityCheck(null);
            }}
            onOk={handleSubmit}
            okText="确认预约"
            cancelText="取消"
            okButtonProps={{ disabled: !availabilityCheck?.available }}
            width={640}
        >
            <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                {conflictWarning && (
                    <Alert
                        type="warning"
                        showIcon
                        message="预选营位不可用"
                        description={conflictWarning}
                        style={{ marginBottom: 16 }}
                        closable
                        onClose={() => setConflictWarning(null)}
                    />
                )}

                <Form.Item
                    name="dateRange"
                    label="入住日期"
                    rules={[{ required: true, message: "请先选择入住日期" }]}
                    extra={!campsiteAvailabilities ? "请先选择入住日期，系统将自动显示各营位的可用状态" : ""}
                >
                    <DatePicker.RangePicker
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                        placeholder={["入住日期", "退房日期"]}
                    />
                </Form.Item>

                <Form.Item
                    name="campsiteId"
                    label="选择营位"
                    rules={[{ required: true, message: "请选择营位" }]}
                    extra={campsiteAvailabilities ? `已根据您选择的日期范围，自动标记不可预约的营位` : "请先选择入住日期"}
                >
                    <Select
                        placeholder={campsiteAvailabilities ? "请选择营位（红色=已占用，橙色=维修中）" : "请先选择入住日期"}
                        options={campsiteOptions}
                        optionFilterProp="label"
                        disabled={!campsiteAvailabilities}
                    />
                </Form.Item>

                {selectedCampsite && (
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <strong>{selectedCampsite.name}</strong>
                                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                                    类型：{selectedCampsite.type === "tent" ? "帐篷" : selectedCampsite.type === "rv" ? "房车" : "木屋"}
                                    <span style={{ margin: "0 8px" }}>|</span>
                                    面积：{selectedCampsite.area}㎡
                                </div>
                                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                                    设施：{selectedCampsite.facilities.join("、")}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ color: "#b14f3b", fontSize: 20, fontWeight: "bold" }}>
                                    ¥{selectedCampsite.basePrice}
                                </div>
                                <div style={{ color: "#999", fontSize: 12 }}>每晚/人</div>
                            </div>
                        </div>
                    </Card>
                )}

                <Form.Item
                    name="guestCount"
                    label="入住人数"
                    rules={[{ required: true, message: "请输入入住人数" }]}
                >
                    <InputNumber min={1} max={10} style={{ width: "100%" }} placeholder="请输入入住人数" />
                </Form.Item>

                <Form.Item
                    name="customerName"
                    label="客户姓名"
                    rules={[{ required: true, message: "请输入客户姓名" }]}
                >
                    <Input placeholder="请输入客户姓名" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="联系电话"
                    rules={[
                        { required: true, message: "请输入联系电话" },
                        { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" },
                    ]}
                >
                    <Input placeholder="请输入联系电话" />
                </Form.Item>

                {availabilityCheck && !availabilityCheck.available && (
                    <Alert
                        type="error"
                        showIcon
                        message="该营位在此期间不可预约"
                        description={availabilityCheck.reason}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {availabilityCheck?.available && selectedCampsite && formValues?.dateRange && (
                    <Alert
                        type="success"
                        showIcon
                        message="该营位在此期间可预约"
                        description={`预计费用：¥${selectedCampsite.basePrice *
                            formValues.dateRange[1].diff(formValues.dateRange[0], "day") *
                            (formValues.guestCount || 1)
                            }`}
                        style={{ marginBottom: 16 }}
                    />
                )}
            </Form>
        </Modal>
    );
}
