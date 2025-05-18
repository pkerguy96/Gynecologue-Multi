import { APIClient } from "./Http";

interface OperationNote {
  id: number;
  patient_id: number;
  patient_name: string;
  note: string;
}

interface CompteRendu {
  status: string;
  message: string;
  data: OperationNote[];
}

export const fetchCompteRendu = new APIClient<CompteRendu>("compterendu");
interface Observation {
  id: number;
  patient_id: number;
  note: string; // HTML content as a string
  patient: string; // Patient full name
  created_at: string; // Formatted date (DD/MM/YYYY)
}

interface ObservationResponse {
  data: Observation[];
}
export const fetchobservations = new APIClient<ObservationResponse>(
  "allobservation"
);
export const storeObservationsApiClient = new APIClient<any>(
  "storeobservation"
);
export const showObservationApiClient = new APIClient<any>("showbservation");
export const updateObservationApiClient = new APIClient<any>(
  "updateObservation"
);
export const deleteObservationApiClient = new APIClient<any>(
  "deleteObservation"
);
