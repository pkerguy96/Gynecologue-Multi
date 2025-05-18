import * as React from "react";
import Menu from "@mui/material/Menu";
import AlarmIcon from "@mui/icons-material/Alarm";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  WaitingroomCounter,
  clearPatientCounterApiClient,
  incrementPatientApiClient,
  incrementbyone,
  waitingRoomApiClient,
} from "../services/WaitingroomService";
import {
  CACHE_KEY_PatientsWaitingRoom,
  CACHE_KEY_WAITINGLIST,
} from "../constants";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import addGlobal from "../hooks/addGlobal";
import getGlobal from "../hooks/getGlobal";
import { useSnackbarStore } from "../zustand/useSnackbarStore";
import { AxiosError } from "axios";
import PatientSearchAutocomplete from "./PatientSearchAutocomplete";
import { usePusher } from "../services/usePusher";
const menuItems = [
  { value: "Consultation", label: "Consultation", color: "#D99182" }, // Muted Coral
  { value: "Contrôle", label: "Contrôle", color: "#6A8CAA" }, // Steel Blue
];
function WaitingRoomMenu() {
  const [events, setEvents] = useState<any[]>([]);
  const [height, setHeight] = useState("auto");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  const waiting = getGlobal(
    {} as WaitingroomCounter,
    CACHE_KEY_PatientsWaitingRoom,
    waitingRoomApiClient,
    {
      refetchInterval: 10000,
    }
  );
  const AddPatient = addGlobal({} as incrementbyone, incrementPatientApiClient);
  const { showSnackbar } = useSnackbarStore();
  const adjustHeight = useCallback(
    (options: { id: number; name: string }[]) => {
      const newHeight =
        options.length === 0 ? "auto" : 200 + 30 * options.length + "px";
      setHeight(newHeight);
    },
    []
  );

  const resetPatientCounter = useCallback(async () => {
    try {
      const response = await clearPatientCounterApiClient.getone();
      if (response.status >= 200 && response.status < 300) {
        queryClient.invalidateQueries(CACHE_KEY_PatientsWaitingRoom);
        queryClient.invalidateQueries(CACHE_KEY_WAITINGLIST);
      } else {
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const open = Boolean(anchorEl);
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  const handleEvent = (data: any) => {
    console.log("Event received:", data);
    setEvents((prev) => [...prev, data]); // Add the event to the list
  };
  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value);
  };

  const addPatientToWaitingList = async () => {
    await AddPatient.mutateAsync(
      { patient_id: selectedPatient?.id, visit_reason: selectedType },
      {
        onSuccess(data: any) {
          waiting.refetch();
          console.log(data?.message);

          showSnackbar(data?.message, "success");
          queryClient.invalidateQueries(CACHE_KEY_WAITINGLIST);
        },
        onError(error: any) {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message
              : error.message;
          showSnackbar(message, "error");
        },
      }
    );
  };

  usePusher("test-channel", "patient-added", handleEvent);
  return (
    <div>
      <IconButton
        color="inherit"
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <AlarmIcon />
      </IconButton>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          style: {
            width: "400px",
            height: height,
            maxHeight: 470,
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            gap: "1rem",
          },
          "aria-labelledby": "basic-button",
        }}
      >
        {waiting.isLoading ? (
          <LoadingSpinner />
        ) : (
          <Box className="flex flex-col gap-4">
            <Box tabIndex={-1} className="flex items-center justify-between">
              <span className="font-medium text-md">Nombre patients</span>
              <Box className="flex flex-row gap-2">
                <span className="flex justify-center items-center text-xl text-[#4B918C]">
                  {waiting.data}
                </span>
              </Box>
            </Box>
            <Box className="flex justify-center items-center w-full gap-8">
              <PatientSearchAutocomplete
                setPatient={setSelectedPatient}
                onOptionsChange={adjustHeight}
                showExternalLabel={false}
                options={[]}
              />
            </Box>
            <Box className="flex justify-center items-center w-full gap-8">
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Type</InputLabel>
                {/* <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  label="Age"
                  value={selectedType}
                  onChange={handleTypeChange}
                >
                    <MenuItem value="Consultation">
                    <Box className="flex flex-wrap justify-between">
                      Consultation
                      <span classname="">dot</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Suivi">Contrôle</MenuItem>
                  {menuItems.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      <ListItemIcon>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: item.color,
                            borderRadius: "50%",
                            display: "inline-block",
                          }}
                        />
                      </ListItemIcon>
                      <Typography variant="body1">{item.label}</Typography>
                    </MenuItem>
                  ))}
                </Select> */}
                <Select
                  label="Age"
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedType}
                  onChange={handleTypeChange}
                  renderValue={(selected) => {
                    if (!selected) return ""; // Placeholder text

                    // Find selected item
                    const selectedItem = menuItems.find(
                      (item) => item.value === selected
                    );

                    // Return only the text (NO DOT)
                    return (
                      <Typography variant="body1">
                        {selectedItem?.label}
                      </Typography>
                    );
                  }}
                >
                  {menuItems.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      <ListItemIcon>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: item.color,
                            borderRadius: "50%",
                            display: "inline-block",
                          }}
                        />
                      </ListItemIcon>
                      <Typography variant="body1">{item.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box className="flex flex-wrap items-center justify-end gap-4">
              <Button
                type="submit"
                variant="contained"
                size="small"
                className="rounded-lg !ms-auto"
                onClick={addPatientToWaitingList}
              >
                Ajouter
              </Button>
              <Button
                className="ml-auto mb-2"
                variant="outlined"
                size="small"
                color="error"
                endIcon={<DeleteIcon />}
                onClick={resetPatientCounter}
              >
                Vider
              </Button>
            </Box>
          </Box>
        )}
      </Menu>
    </div>
  );
}
export default React.memo(WaitingRoomMenu);
