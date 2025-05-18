import { APIClient } from "./Http";

export const storeDoctorFileApiClient = new APIClient<any>("storeDoctorFile");
export const getDoctorFileApiClient = new APIClient<any>("getDoctorFiles");
export const deleteDoctorFileApiClient = new APIClient<any>("deleteDoctorFile");
