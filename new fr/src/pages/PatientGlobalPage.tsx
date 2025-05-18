import { useState } from "react";
import { Box, FormControl, Paper, TextField } from "@mui/material";

import useUserRoles from "../zustand/UseRoles";
import PatientsTable from "../components/Tables/PatientsTable";

interface SentDebtData {
  date: string;
  date2: string;
}

const PatientGlobalPage = () => {
  const { can } = useUserRoles();
  const [dates, setDates] = useState({ start: "", end: "" });

  const hasAccess = can(["access_patient", "doctor"]);

  if (!hasAccess) {
    return (
      <div style={{ textAlign: "center", color: "red", marginTop: "20px" }}>
        Vous n'avez pas la permission de consulter cette page.
      </div>
    );
  }

  return (
    <Paper className="p-4">
      <Box
        component="form"
        className="w-full flex flex-col gap-6"
        autoComplete="off"
      >
        <Box className="w-full flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <Box className="flex w-full md:w-0 items-start gap-1 flex-1 flex-col">
            <label htmlFor="date">Date de début</label>
            <FormControl className="w-full md:flex-1">
              <TextField
                required
                type="date"
                id="date"
                value={dates.start}
                onChange={(e) => setDates({ ...dates, start: e.target.value })}
              />
            </FormControl>
          </Box>
          <Box className="flex w-full md:w-0  items-start gap-1 flex-1 flex-col">
            <label htmlFor="date2">Date de fin</label>
            <FormControl className="w-full md:flex-1">
              <TextField
                required
                type="date"
                id="date2"
                value={dates.end}
                onChange={(e) => setDates({ ...dates, end: e.target.value })}
              />
            </FormControl>
          </Box>
        </Box>

        <PatientsTable dates={dates} />
      </Box>
    </Paper>
  );
};
const autocompleteStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "white",
    borderColor: "rgba(0, 0, 0, 0.23)",
    "& fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover fieldset": {
      borderColor: "dark",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
};
export default PatientGlobalPage;
