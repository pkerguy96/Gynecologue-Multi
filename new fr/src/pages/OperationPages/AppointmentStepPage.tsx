import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  LocalizationProvider,
  DateTimePicker,
  DateTimeValidationError,
  PickerChangeHandlerContext,
} from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";
import React, { useRef, useState } from "react";
import { CACHE_KEY_PATIENTS } from "../../constants";
import getGlobalById from "../../hooks/getGlobalById";
import patientAPIClient, {
  OnlyPatientData,
} from "../../services/PatientService";
import addGlobal from "../../hooks/addGlobal";
import appointmentAPIClient from "../../services/AppointmentService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router";
import { CliniquerensignementProps } from "../OperationPagesUpdated/Cliniquerensignement";
import KeyboardBackspaceOutlinedIcon from "@mui/icons-material/KeyboardBackspaceOutlined";

interface DataSend {
  patient_id: number;
  title?: string;
  date: string;
  note?: string;
}
const AppointmentStepPage: React.FC<CliniquerensignementProps> = ({
  onNext,
  onBack,
}: any) => {
  const [selectedDateTime, setSelectedDateTime] = useState(moment());
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const patient_id = queryParams.get("id");
  const { showSnackbar } = useSnackbarStore();
  const noteRef = useRef<HTMLInputElement>(null);
  const dateTimePickerRef = useRef(null);
  if (!patient_id) {
    throw new Error("Patient ID is required and must not be null");
  }
  const { data, isLoading } = getGlobalById(
    {} as OnlyPatientData,
    [CACHE_KEY_PATIENTS[0], patient_id],
    patientAPIClient,
    undefined,
    parseInt(patient_id)
  );

  const Addmutation = addGlobal({} as DataSend, appointmentAPIClient);
  if (isLoading) return <LoadingSpinner />;

  const handleDateTimeChange = (
    value: Moment | null,
    _context: PickerChangeHandlerContext<DateTimeValidationError>
  ) => {
    if (value !== null) {
      setSelectedDateTime(value);
    } else {
      return;
    }
  };
  const onsubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation for the date field
    if (!selectedDateTime) {
      showSnackbar("Veuillez sélectionner une date.", "error");
      return;
    }
    const formData = {
      patient_id: parseInt(patient_id),

      date: selectedDateTime.format("YYYY-MM-DDTHH:mm:ss"),
      note: noteRef?.current?.value,
    };

    await Addmutation.mutateAsync(formData, {
      onSuccess: () => {
        const currentParams = new URLSearchParams(location.search);
        currentParams.set("isdone", "0");
        navigate(`${location.pathname}?${currentParams.toString()}`, {
          replace: true,
        });

        onNext();
      },
      onError: (error: any) => {
        const message =
          error instanceof AxiosError
            ? error.response?.data?.message
            : error.message;
        showSnackbar(message, "error");
      },
    });
  };

  return (
    <div>
      <Paper className="!p-6 w-full flex flex-col gap-6">
        <Box className="flex justify-center relative">
          <Tooltip title="Retour">
            <IconButton className="!absolute -top-1 left-0" onClick={onBack}>
              <KeyboardBackspaceOutlinedIcon
                color="primary"
                className="pointer-events-none"
                fill="currentColor"
              />
            </IconButton>
          </Tooltip>
          <Typography
            id="modal-modal-title"
            component="h2"
            className="text-center !text-2xl font-bold"
          >
            Ajouter un rendez-vous ?
          </Typography>
        </Box>
        <Box className="flex gap-4 flex-col">
          <TextField
            fullWidth
            id="name"
            value={`${data.nom} ${data.prenom}`}
            disabled
          />

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker
              value={selectedDateTime}
              ampm={false}
              onChange={handleDateTimeChange}
              inputRef={dateTimePickerRef}
            />
          </LocalizationProvider>

          <TextField
            inputRef={noteRef}
            id="large-text"
            label="Note"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
          />
        </Box>
        <Box className="flex justify-between flex-row content-center">
          <Button
            className="w-full md:w-max !px-10 !py-3 rounded-lg "
            variant="outlined"
            onClick={() => {
              onNext();
            }}
          >
            <p className="text-sm ">Passer</p>
          </Button>
          <Button
            onClick={onsubmit}
            variant="contained"
            className="w-full md:w-max !px-10 !py-3 rounded-lg !ms-auto"
          >
            Confirmer
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export default AppointmentStepPage;
