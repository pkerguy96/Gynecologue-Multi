import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import addGlobal from "../../hooks/addGlobal";
import {
  getuserlocationSettingsApiClient,
  locationSettingsApiClient,
} from "../../services/SettingsService";
import { AxiosError } from "axios";
import getGlobal from "../../hooks/getGlobal";
import { CACHE_KEY_userLocation } from "../../constants";
import LoadingSpinner from "../LoadingSpinner";

const Printsettings = () => {
  const [includeHeader, setIncludeHeader] = useState(false);
  const { showSnackbar } = useSnackbarStore();
  const [city, setCity] = useState("");

  const addMutation = addGlobal({} as any, locationSettingsApiClient);
  const { data, isLoading } = getGlobal(
    {} as any,
    CACHE_KEY_userLocation,
    getuserlocationSettingsApiClient,
    undefined
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission

    if (!city) {
      showSnackbar("Veuillez entrer une ville ", "error");
      return;
    }

    try {
      addMutation.mutateAsync(
        { location: city, header: includeHeader },
        {
          onSuccess: () => {
            showSnackbar("L'emplacement a été mis à jour", "success");
            const json = JSON.parse(localStorage.getItem("user_login"));
            json.location = city;
            json.headerprint = includeHeader;
            localStorage.setItem("user_login", JSON.stringify(json));
            /*  refetch(); */
          },
          onError: (error: any) => {
            const message =
              error instanceof AxiosError
                ? error.response?.data?.message
                : error.message;
            showSnackbar(message, "error");
          },
        }
      );
    } catch (error) {}
  };
  useEffect(() => {
    if (data !== undefined && data !== null) {
      setCity(data.location || "");
      setIncludeHeader(Boolean(data.header));
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  return (
    <Box
      className="flex flex-col w-full gap-6"
      component="form"
      onSubmit={handleSubmit}
    >
      <Box className="flex justify-center">
        <Typography
          id="modal-modal-title"
          component="h2"
          className="text-center !text-2xl font-medium"
        >
          Paramètres d'impression
        </Typography>
      </Box>

      <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center ">
        <label htmlFor="nom" className="w-full md:w-[160px]">
          Ville:
        </label>
        <FormControl className="w-full md:flex-1 gap-2 ">
          <TextField
            id="name"
            label="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <span className="text-gray-500 text-sm">
            Ce paramètre changera la ville de localisation des pages à imprimer
            ex : ordonnance, analyses etc...
          </span>
        </FormControl>
      </Box>
      <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center ">
        <label htmlFor="nom" className="w-full md:w-[160px]">
          Inclure l'en-tête :
        </label>
        <FormControl className="w-full md:flex-1">
          <FormControlLabel
            control={
              <Checkbox
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
              />
            }
            label="Inclure l'en-tête"
          />
          <span className="text-gray-500 text-sm">
            Inclure l'en-tête d'impression (ex: Nom du patient, Date)
          </span>
        </FormControl>
      </Box>

      <Box className="flex ml-auto mt-4">
        <Button
          type="submit"
          variant="contained"
          className="w-full md:w-max !px-8 !py-2 rounded-lg "
        >
          Ajouter
        </Button>
      </Box>
    </Box>
  );
};

export default Printsettings;
