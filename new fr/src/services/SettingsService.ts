import { APIClient } from "./Http";
export interface SettingsData {
  period: string;
}
export interface OperationPreference {
  id?: number | undefined;
  name?: string;
  code?: string;
  price: number;
  operation_type?: string;
}
export interface DeleteOperationPreference {
  id: number;
}
export interface LocationPref {
  location: string;
}
export const SettingsApiClient = new APIClient<SettingsData>(
  "DashboardKpiUserPref"
);
export const locationSettingsApiClient = new APIClient<LocationPref>(
  "LocationPref"
);
export const getuserlocationSettingsApiClient = new APIClient<LocationPref>(
  "getUserLocation"
);
export const OperationPrefApiClient = new APIClient<OperationPreference>(
  "OperationPreferences"
);
export const OperationsPrefApiClient = new APIClient<OperationPreference[]>(
  "getOperationPrefs"
);
export const DeleteOperationsPrefApiClient =
  new APIClient<DeleteOperationPreference>("deleteOperationPrefs");

export interface XrayPreference {
  id: number;
  xray_name: string;
  price: string;
}

export interface XrayPreferencesResponse {
  data: XrayPreference[];
}

export const XrayPreferenceApiClient = new APIClient<XrayPreferencesResponse>(
  "XrayPreferences"
);
