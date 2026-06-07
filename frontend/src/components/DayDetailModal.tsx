import { Modal, Tag, Table, Space, Button } from "antd";
import { ToolOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { DayCampsiteStatus, CampsiteStatus } from "../types";
import { getStatusColor } from "../utils/calendarUtils";

interface DayDetailModalProps {
    open: boolean;
    date: string;
    campsiteStatuses: DayCampsiteStatus[];
    onClose: () => void;
    onBookCampsite?: (campsiteId: string, date: string) => void;
}

const statusIcons: Record<CampsiteStatus, React.ReactNode> = {
    available: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
    occupied: <UserOutlined style={{ color: "#b14f3b" }} />,
    maintenance: <ToolOutlined style={{ color: "#faad14" }} />,
};

const statusTextMap: Record<CampsiteStatus, string> = {
    available: "空闲",
    occupied: "已被预约",
    maintenance: "维修中",
};

export function DayDetailModal({ open, date, campsiteStatuses, onClose, onBookCampsite }: DayDetailModalProps) {
    const columns = [
        {
            title: "营位名称",
            dataIndex: "campsiteName",
            key: "campsiteName",
            width: 140,
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: CampsiteStatus) => (
                <Tag color={getStatusColor(status)} icon={statusIcons[status]}>
                    {statusTextMap[status]}
                </Tag>
            ),
        },
        {
            title: "详情",
            dataIndex: "detail",
            key: "detail",
            render: (_: unknown, record: DayCampsiteStatus) => {
                if (record.status === "occupied" && record.customerName) {
                    return <span>入住客户：{record.customerName}</span>;
                }
                if (record.status === "maintenance" && record.maintenanceReason) {
                    return <span style={{ color: "#faad14" }}>维修原因：{record.maintenanceReason}</span>;
                }
                return <span style={{ color: "#52c41a" }}>可立即预约</span>;
            },
        },
        {
            title: "操作",
            key: "action",
            width: 120,
            render: (_: unknown, record: DayCampsiteStatus) => (
                <Button
                    type="primary"
                    size="small"
                    disabled={record.status !== "available"}
                    onClick={() => onBookCampsite?.(record.campsiteId, date)}
                >
                    预约
                </Button>
            ),
        },
    ];

    const availableCount = campsiteStatuses.filter((s) => s.status === "available").length;
    const occupiedCount = campsiteStatuses.filter((s) => s.status === "occupied").length;
    const maintenanceCount = campsiteStatuses.filter((s) => s.status === "maintenance").length;

    return (
        <Modal
            title={`${date} 营位详情`}
            open={open}
            onCancel={onClose}
            footer={null}
            width={720}
        >
            <Space style={{ marginBottom: 16 }} wrap>
                <Tag color="green">空闲：{availableCount} 个</Tag>
                <Tag color="red">已占：{occupiedCount} 个</Tag>
                <Tag color="orange">维修：{maintenanceCount} 个</Tag>
            </Space>
            <Table
                dataSource={campsiteStatuses}
                columns={columns}
                rowKey="campsiteId"
                pagination={false}
                size="middle"
            />
        </Modal>
    );
}
