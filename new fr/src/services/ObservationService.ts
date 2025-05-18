import { APIClient } from "./Http";

export const observationApiClient = new APIClient<any>("/StoreObservationNote");
export const editObservationApiClient = new APIClient<any>(
  "/EditObservationNote"
);
export const fetchObservationApiClient = new APIClient<any>(
  "/GetObservationNote"
);
