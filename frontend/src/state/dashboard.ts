import { localFeatures, localKpis, operationRecords } from "../data/workbench";
import type { OverviewResponse } from "../types";
import { APP_CODE, APP_NAME } from "../constants/app";

export function createFallbackOverview(): OverviewResponse {
  return {
    appName: APP_NAME,
    appCode: APP_CODE,
    description: "面向露营地/房车营地，提供营位可视化预约、装备租赁和活动管理的综合运营平台。",
    features: localFeatures,
    kpis: localKpis,
    records: operationRecords,
  };
}
