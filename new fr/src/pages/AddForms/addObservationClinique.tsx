import { Paper, Box, Typography, Button } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import PatientSearchAutocomplete from "../../components/PatientSearchAutocomplete";
import RichTextEditor from "../../components/RichTextEditor";
import addGlobal from "../../hooks/addGlobal";
import {
  showObservationApiClient,
  storeObservationsApiClient,
  updateObservationApiClient,
} from "../../services/CompteRenduService";
import {
  CACHE_KEY_Patientobservation,
  CACHE_KEY_PatienttinyData,
} from "../../constants";
import getGlobalById from "../../hooks/getGlobalById";
import CheckAction from "../../components/CheckAction";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useSearchParams } from "react-router-dom";
import { patientTinyDataAPIClient } from "../../services/PatientService";
import updateItem from "../../hooks/updateItem";
import { AxiosError } from "axios";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";

import RichEditorPrint from "../RichEditorPrint";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const AddObservationClinique = () => {
  const { showSnackbar } = useSnackbarStore();
  const { print, Printable } = RichEditorPrint();

  const { control, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      patient: null,
      note: "",
    },
  });
  const [searchParams] = useSearchParams();
  const obsID = searchParams.get("obsID");
  const id = searchParams.get("id");
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const [patientPrint, SetPatientPrint] = useState<{
    id: number;
    nom: string;
    prenom: string;
  } | null>(null);
  const addMutation = addGlobal({} as any, storeObservationsApiClient);
  const useUpdateOrdonance = updateItem({}, updateObservationApiClient);

  const isAddMode = !id;
  const { data, isLoading } = obsID
    ? getGlobalById(
        {},
        [CACHE_KEY_Patientobservation, obsID],
        showObservationApiClient,
        undefined,
        parseInt(obsID)
      )
    : { data: {}, isLoading: false };
  const { data: patient, isLoading: isLoading2 } = id
    ? getGlobalById(
        {},
        [CACHE_KEY_PatienttinyData, id],
        patientTinyDataAPIClient,
        undefined,
        parseInt(id)
      )
    : { data: {}, isLoading: false };

  const onSubmit = async (data: any) => {
    if (!data.patient || !data.patient.id) {
      showSnackbar("Veuillez sélectionner un patient.", "warning");
      return;
    }
    try {
      if (isAddMode) {
        await createAction({
          patient_id: data.patient.id,
          note: data.note,
        });
      } else {
        await editUser(
          {
            patient_id: data.patient.id,
            note: data.note,
          },
          parseInt(obsID)
        );
      }
    } catch (error) {}
  };

  const createAction = async (formData) => {
    return await addMutation.mutateAsync(
      {
        data: { ...formData, note: content },
      },
      {
        onSuccess: (data: {
          data: { id: number; nom: string; prenom: string };
        }) => {
          queryClient.invalidateQueries({
            queryKey: ["Patientobservation"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["Patientsobservation"],
            exact: false,
          });

          SetPatientPrint(data?.data);
        },
        onError: (error: any) => {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message
              : error.message;
          showSnackbar(message, "warning");
        },
      }
    );
  };
  const editUser = async (formData: any, ordonanceID: number) => {
    await useUpdateOrdonance.mutateAsync(
      {
        data: { ...formData, note: content },
        id: ordonanceID,
      },
      {
        onSuccess: (data: {
          data: { id: number; nom: string; prenom: string };
        }) => {
          queryClient.invalidateQueries({
            queryKey: ["Patientobservation"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["Patientsobservation"],
            exact: false,
          });

          SetPatientPrint(data?.data);
        },
        onError: (error: any) => {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message
              : error.message;
          showSnackbar(message, "warning");
        },
      }
    );
  };
  CheckAction(() => {
    if (patient && patient.id) {
      setValue("patient", {
        id: patient.id,
        name: `${patient.nom} ${patient.prenom}`,
      });
    }
  }, [patient]);
  useEffect(() => {
    if (data && data.note) {
      setContent(data.note);
    }
  }, [data]);

  useEffect(() => {
    if (!patientPrint) return;
    print(() => {});
  }, [patientPrint]);
  if (isLoading || isLoading2) return <LoadingSpinner />;
  return (
    <Paper className="p-4">
      <Box
        component="form"
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-6 relative"
      >
        <Box className="flex justify-center">
          <Typography
            id="modal-modal-title"
            component="h2"
            className="text-center !text-2xl font-bold"
          >
            {isAddMode || !obsID
              ? "Ajouter une observation clinique"
              : "Modifier une observation clinique"}
          </Typography>
        </Box>

        <Box className="w-full flex flex-col gap-8">
          {/* Patient Field */}
          <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center mt-2">
            <label htmlFor="nom" className="w-full md:w-[160px]">
              Patient:
            </label>
            <Box className="w-full md:flex-1">
              <Controller
                name="patient"
                control={control}
                render={({ field }) => (
                  <PatientSearchAutocomplete
                    options={[]}
                    showExternalLabel={false}
                    setPatient={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </Box>
          </Box>

          <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center mt-2">
            <Box className="w-full">
              <RichTextEditor value={content} onBlur={setContent} />
            </Box>
          </Box>
        </Box>

        <Box className="flex justify-between flex-row content-center">
          <Button
            type="submit"
            variant="contained"
            className="w-full md:w-max !px-10 !py-3 rounded-lg !ms-auto"
          >
            {isAddMode
              ? addMutation.isLoading
                ? "Ajout en cours..."
                : "Enregistrer"
              : useUpdateOrdonance.isLoading
              ? "Mise à jour..."
              : "Enregistrer"}
          </Button>
        </Box>
      </Box>
      <Printable
        title={"Observation clinique"}
        content={content}
        name={`${patientPrint?.nom} ${patientPrint?.prenom}`}
      />
    </Paper>
  );
};

export default AddObservationClinique;
