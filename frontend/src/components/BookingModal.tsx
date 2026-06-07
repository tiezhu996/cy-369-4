import { useState, useEffect } from "react";
import { Modal, Form, Input, DatePicker, Select, InputNumber, Alert, Card, Tag } from "antd";
import type { Campsite, Booking, MaintenanceRecord } from "../types";
import { isCampsiteAvailableForBooking } from "../utils/calendarUtils";
import dayjs, { Dayjs } from "dayjs";

interface BookingModalProps {
    open: boolean;
    campsites: Campsite[];
    bookings: Booking[];
    maintenanceRecords: MaintenanceRecord[];
    preselectedCampsiteId?: string;
    preselectedDate?: string;
    onClose: () => void;
    onSubmit: (booking: Omit<Booking, "id" | "status">) => void;
}

interface BookingFormValues {
    campsiteId: string;
    customerName: string;
    phone: string;
    dateRange: [Dayjs, Dayjs];
    guestCount: number;
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
}: BookingModalProps) {
    const [form] = Form.useForm<BookingFormValues>();
    const [selectedCampsiteId, setSelectedCampsiteId] = useState<string | undefined>(preselectedCampsiteId);
    const [availabilityCheck, setAvailabilityCheck] = useState<{ available: boolean; reason?: string } | null>(null);
    const [formValues, setFormValues] = useState<BookingFormValues | null>(null);

    useEffect(() => {
        if (open) {
            if (preselectedCampsiteId) {
                setSelectedCampsiteId(preselectedCampsiteId);
                setTimeout(() => form.setFieldsValue({ campsiteId: preselectedCampsiteId }), 0);
            }
            if (preselectedDate) {
                const date = dayjs(preselectedDate);
                setTimeout(() => form.setFieldsValue({ dateRange: [date, date.add(1, "day")] }), 0);
            }
        } else {
            setSelectedCampsiteId(undefined);
            setAvailabilityCheck(null);
            setFormValues(null);
        }
    }, [open, preselectedCampsiteId, preselectedDate, form]);

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

    const handleValuesChange = (_: Partial<BookingFormValues>, allValues: BookingFormValues) => {
        setFormValues(allValues);
    };

    const campsiteOptions = campsites.map((campsite) => {
        const hasActiveMaintenance = maintenanceRecords.some(
            (m) => m.campsiteId === campsite.id && m.status !== "completed"
        );
        return {
            label: (
                <span style={{ opacity: hasActiveMaintenance ? 0.5 : 1 }}>
                    {campsite.name}
                    {hasActiveMaintenance && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                            维修中
                        </Tag>
                    )}
                </span>
            ),
            value: campsite.id,
            disabled: hasActiveMaintenance,
        };
    });

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
            setSelectedCampsiteId(undefined);
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
                setSelectedCampsiteId(undefined);
                setAvailabilityCheck(null);
            }}
            onOk={handleSubmit}
            okText="确认预约"
            cancelText="取消"
            okButtonProps={{ disabled: !availabilityCheck?.available }}
            width={640}
        >
            <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                <Form.Item
                    name="campsiteId"
                    label="选择营位"
                    rules={[{ required: true, message: "请选择营位" }]}
                >
                    <Select
                        placeholder="请选择营位"
                        options={campsiteOptions}
                        onChange={(value) => setSelectedCampsiteId(value)}
                        optionFilterProp="label"
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
                    name="dateRange"
                    label="入住日期"
                    rules={[{ required: true, message: "请选择入住日期" }]}
                >
                    <DatePicker.RangePicker
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                </Form.Item>

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
