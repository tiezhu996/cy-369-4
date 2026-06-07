export const overviewData = {
  "appName": "露营基地预约管理系统",
  "appCode": "ldcampingbase",
  "description": "面向露营地/房车营地，提供营位可视化预约、装备租赁和活动管理的综合运营平台。",
  "features": [
    {
      "id": 1,
      "title": "营位GIS地图可视化",
      "description": "以营地平面图展示各营位位置，区分帐篷区、房车区、木屋区，点击营位查看面积、设施（电源/水源/篝火位）和实景照片。",
      "status": "已上线",
      "metric": "88%"
    },
    {
      "id": 2,
      "title": "营位类型与预约",
      "description": "选择日期和入住天数，在地图上点选空闲营位，系统自动计算费用（含营位费+人数附加费），支持连续多日预约。",
      "status": "排期中",
      "metric": "31 单"
    },
    {
      "id": 3,
      "title": "装备租赁管理",
      "description": "管理可租赁装备（帐篷/睡袋/炊具/桌椅），记录库存和租赁状态，用户预约营位时可同步选择装备租赁套餐，离营时归还检查。",
      "status": "巡检中",
      "metric": "10 项"
    },
    {
      "id": 4,
      "title": "篝火晚会活动报名",
      "description": "营地定期举办篝火晚会、星空观测、户外电影等活动，用户可在线报名，查看活动详情（时间/地点/人数限制/费用）。",
      "status": "优化中",
      "metric": "4 级"
    },
    {
      "id": 5,
      "title": "营位占用日历与设施管理",
      "description": "以日历视图展示各营位的占用情况，管理员可标记设施维修状态，维修期间该营位不可预约。",
      "status": "可导出",
      "metric": "28 条"
    }
  ],
  "kpis": [
    {
      "label": "今日处理",
      "value": "112",
      "trend": "+12%",
      "tone": "primary"
    },
    {
      "label": "预约/订单",
      "value": "52",
      "trend": "+8%",
      "tone": "warm"
    },
    {
      "label": "履约率",
      "value": "92%",
      "trend": "+3%",
      "tone": "cool"
    },
    {
      "label": "待处理",
      "value": "7",
      "trend": "需跟进",
      "tone": "neutral"
    }
  ],
  "records": [
    {
      "key": "ldcampingbase-1",
      "name": "营位GIS地图可视化",
      "owner": "运营组",
      "status": "已上线",
      "metric": "88%",
      "priority": "高"
    },
    {
      "key": "ldcampingbase-2",
      "name": "营位类型与预约",
      "owner": "管理员",
      "status": "排期中",
      "metric": "31 单",
      "priority": "中"
    },
    {
      "key": "ldcampingbase-3",
      "name": "装备租赁管理",
      "owner": "服务台",
      "status": "巡检中",
      "metric": "10 项",
      "priority": "低"
    },
    {
      "key": "ldcampingbase-4",
      "name": "篝火晚会活动报名",
      "owner": "财务组",
      "status": "优化中",
      "metric": "4 级",
      "priority": "高"
    },
    {
      "key": "ldcampingbase-5",
      "name": "营位占用日历与设施管理",
      "owner": "审核组",
      "status": "可导出",
      "metric": "28 条",
      "priority": "中"
    }
  ]
};
