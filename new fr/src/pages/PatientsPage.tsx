import { Outlet, useLocation } from "react-router";
import PatientsTable from "../components/Tables/PatientsTable";
import PatientGlobalPage from "./PatientGlobalPage";

const PatientsPage = () => {
  const location = useLocation();
  const isOperateRoute = location.pathname.startsWith("/Patients/Xray");
  const isDetailsRoute = location.pathname.startsWith("/Patients/Details");
  const isComingSoonPage = location.pathname.startsWith("/Patients/operations");

  return (
    <>
      {isOperateRoute || isDetailsRoute || isComingSoonPage ? (
        <Outlet />
      ) : (
        <PatientGlobalPage />
      )}
    </>
  );
};

export default PatientsPage;
