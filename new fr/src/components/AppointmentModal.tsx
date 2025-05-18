import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { useQueryClient } from "@tanstack/react-query";
import { CACHE_KEY_APPOINTMENTS } from "../constants";
import { AxiosError } from "axios";
import { useSnackbarStore } from "../zustand/useSnackbarStore";
import addGlobal from "../hooks/addGlobal";
import appointmentAPIClient from "../services/AppointmentService";
import PatientSearchAutocomplete from "./PatientSearchAutocomplete";

interface ModalComponentProps {
  open: boolean;
  onClose: () => void;
  dateTime: string;
}

const AppointmentModal: React.FC<ModalComponentProps> = ({
  open,
  onClose,
  dateTime,
}) => {
  const { showSnackbar } = useSnackbarStore();
  const queryClient = useQueryClient();

  const [appointmentType, setAppointmentType] = useState<string>("Usual");
  const [patient, setPatient] = useState<any | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [dateTimeValue, setDateTimeValue] = useState<string>(
    moment().local().format("YYYY-MM-DDTHH:mm:ss")
  );

  const [note, setNote] = useState("");

  const addMutation = addGlobal({}, appointmentAPIClient);

  const handleAppointmentTypeChange = useCallback((event: any) => {
    setAppointmentType(event.target.value);
    // Reset fields when changing type
    setPatient(null);
    setPhoneNumber("");
    setNote("");
  }, []);

  const handlePhoneNumberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPhoneNumber(event.target.value);
    },
    []
  );

  const handleNoteChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNote(event.target.value);
    },
    []
  );

  const handleDateTimeChange = useCallback(
    (newDateTime: moment.Moment | null) => {
      if (newDateTime) {
        setDateTimeValue(newDateTime.format("YYYY-MM-DDTHH:mm:ss"));
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (appointmentType === "Usual" && (!patient?.id || !dateTimeValue)) {
      showSnackbar("Veuillez sélectionner un patient et une date", "warning");
      return;
    }

    if (appointmentType === "Phone" && !phoneNumber.trim()) {
      showSnackbar("Veuillez entrer un numéro de téléphone", "warning");
      return;
    }

    const formData = {
      phone: appointmentType === "Phone" ? phoneNumber : null,
      patient_id: appointmentType === "Usual" ? patient?.id : null,
      date: dateTimeValue, // Always include dateTime
      note,
      type: appointmentType.toLowerCase(),
    };

    try {
      await addMutation.mutateAsync(formData, {
        onSuccess: () => {
          showSnackbar("Le rendez-vous a été créé", "success");
          queryClient.invalidateQueries(CACHE_KEY_APPOINTMENTS);
          setPatient(null);
          setPhoneNumber("");
          setNote("");
          onClose();
        },
        onError: (error: AxiosError | Error) => {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message || "Une erreur est survenue"
              : error.message;
          showSnackbar(message, "warning");
        },
      });
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || "Une erreur est survenue"
          : error.message;
      showSnackbar(message, "warning");
    }
  }, [
    appointmentType,
    patient,
    phoneNumber,
    dateTimeValue,
    note,
    addMutation,
    showSnackbar,
    queryClient,
    onClose,
  ]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className="flex justify-center items-center"
    >
      <Box
        sx={{ width: 400, bgcolor: "background.paper", p: 2 }}
        className="flex flex-col items-center gap-4 rounded-lg border-0"
      >
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Détails du rendez-vous
        </Typography>

        {/* Select Appointment Type */}
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-standard-label">Type</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            label="Type"
            value={appointmentType}
            onChange={handleAppointmentTypeChange}
          >
            <MenuItem value="Usual">Rendez-vous en personne</MenuItem>
            <MenuItem value="Phone">Rendez-vous téléphonique</MenuItem>
          </Select>
        </FormControl>

        {/* Show Patient Search if Usual */}
        {appointmentType === "Usual" && (
          <PatientSearchAutocomplete
            setPatient={setPatient}
            showExternalLabel={false}
          />
        )}

        {/* Show Phone Number if Phone Consultation */}
        {appointmentType === "Phone" && (
          <TextField
            fullWidth
            label="Numéro de téléphone"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
          />
        )}

        {/* Show DateTime Picker if Usual */}

        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker
            value={moment(dateTimeValue)}
            ampm={false}
            sx={{ width: "100%" }}
            onChange={handleDateTimeChange}
          />
        </LocalizationProvider>

        {/* Note Field (Common for both) */}
        <TextField
          id="large-text"
          label="Note"
          multiline
          rows={4}
          variant="outlined"
          fullWidth
          value={note}
          onChange={handleNoteChange}
        />

        <Button variant="contained" onClick={handleSubmit}>
          Confirmer
        </Button>
      </Box>
    </Modal>
  );
};

export default AppointmentModal;
