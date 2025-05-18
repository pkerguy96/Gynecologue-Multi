import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import { APIClient } from "../services/Http";
import { AxiosError } from "axios";
import { CACHE_KEY_APPOINTMENTS } from "../constants";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbarStore } from "../zustand/useSnackbarStore";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";
import { useState, useEffect } from "react";
import ModeOutlinedIcon from "@mui/icons-material/ModeOutlined";
import updateItem from "../hooks/updateItem";
import appointmentAPIClient from "../services/AppointmentService";

interface ModalComponentProps {
  open: boolean;
  onClose: () => void;
  data: {
    id: number;
    patient_id: number | null;
    phone_number?: string; // Include phone number for phone appointments
    note: string;
    date: string;
    patient_name: string;
  };
}

const AppointmentConfirmation = ({
  open,
  onClose,
  data,
}: ModalComponentProps) => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbarStore();
  const [selectedDate, setSelectedDate] = useState<Moment | null>(null);

  const addMutation = updateItem<{ id: number; date: string }>(
    {} as any,
    appointmentAPIClient
  );

  const handleDateChange = (newDate: Moment | null) => {
    setSelectedDate(newDate);
  };

  const updateAppointment = async () => {
    try {
      await addMutation.mutateAsync({
        data: {
          id: data?.id,
          date: selectedDate
            ? selectedDate.format("YYYY-MM-DDTHH:mm:ss")
            : data.date,
        },
        id: data?.id,
      });

      queryClient.invalidateQueries(CACHE_KEY_APPOINTMENTS);
      showSnackbar("Le rendez-vous a été modifié avec succès", "success");
      onClose();
    } catch (error: any) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message
          : error.message;
      showSnackbar(message, "error");
    }
  };

  const deleteAppointment = async () => {
    try {
      const apiclient = new APIClient("Appointment");
      await apiclient.DeleteOne(data?.id);
      queryClient.invalidateQueries(CACHE_KEY_APPOINTMENTS);
      showSnackbar("Le rendez-vous est supprimé", "warning");
      onClose();
    } catch (error: any) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message
          : error.message;
      showSnackbar(message, "error");
    }
  };

  useEffect(() => {
    if (data?.date) {
      setSelectedDate(moment(data.date)); // Initialize state with existing appointment date
    }
  }, [data]);

  // Determine if it's a phone appointment
  const isPhoneAppointment = data?.patient_id === null && !!data?.phone_number;

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
        className="flex flex-col items-center gap-3 rounded-lg border-0"
      >
        <Box className="w-full flex flex-row justify-between">
          <Typography id="modal-modal-title" variant="h6">
            Détails du rendez-vous
          </Typography>
          <IconButton onClick={onClose}>
            <ClearIcon />
          </IconButton>
        </Box>

        {/* Show Patient Name or Phone Number */}
        <TextField
          fullWidth
          label={isPhoneAppointment ? "Numéro de téléphone" : "Nom du patient"}
          value={
            isPhoneAppointment ? `📞 ${data?.phone_number}` : data?.patient_name
          }
          disabled
        />

        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker
            ampm={false}
            value={selectedDate}
            onChange={handleDateChange}
            sx={{ width: "100%" }}
          />
        </LocalizationProvider>

        <TextField
          label="Note"
          multiline
          value={data?.note ?? ""}
          rows={4}
          variant="outlined"
          fullWidth
        />

        <Box className="mx-4 w-full flex gap-4 justify-center">
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={deleteAppointment}
          >
            Supprimer
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ModeOutlinedIcon />}
            onClick={updateAppointment}
          >
            Modifier
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AppointmentConfirmation;
