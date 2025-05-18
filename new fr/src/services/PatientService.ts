import { APIClient } from "./Http";
export interface ChildData {
  dob: string;
  birthType: string;
}

export interface OnlyPatientData {
  id?: number;
  nom: string;
  prenom: string;
  cin?: string;
  date: string;
  sex: string;
  address: string;
  phoneNumber?: string;
  mutuelle: string;
  note?: string;
  agecalc?: string;
  allergy?: string[];
  disease?: string[];
  children?: ChildData[];
  referral?: string[];
}
const patientAPIClient = new APIClient<OnlyPatientData>("/Patient");
export const patientTinyDataAPIClient = new APIClient<any>("/patientTinyData");
export default patientAPIClient;
