import {
  Paper,
  Box,
  Typography,
  FormControl,
  TextField,
  Button,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import PatientSearchAutocomplete from "../../components/PatientSearchAutocomplete";
import addGlobal from "../../hooks/addGlobal";
import { birthCalculatorApiClient } from "../../services/Birthcalculator";
import { useSearchParams } from "react-router-dom";
import getGlobalById from "../../hooks/getGlobalById";
import { CACHE_KEY_birthCalculator } from "../../constants";
import LoadingSpinner from "../../components/LoadingSpinner";

import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import updateItem from "../../hooks/updateItem";

const TIMES = {
  FN: {
    LP: (payload) => moment(payload),
    PS: (payload) => moment(payload).subtract(14, "days"),
    PD: (payload) => moment(payload).subtract(TIMES.DUE, "days"),
  },
  START: 14,
  POST: 7,
  DUE: 287,
  INFO: 90,
};

type Age = {
  age: number;
  weeks: number;
  days: number;
};

type ScreeningWindow = {
  start: string;
  end: string;
};

type Screenings = {
  extra: ScreeningWindow[];
  hgpo: ScreeningWindow;
  rhophylac: ScreeningWindow;
  swab: ScreeningWindow;
};

type Consultations = {
  [key: string]: string;
};

type Ultrasounds = {
  [key: string]: ScreeningWindow;
};

type Data = {
  lastPeriod: string;
  startOfPregnancy: string;
  dueDate: string;
  postTermDate: string;

  pregnancyAge: Age;
  consultations: Consultations;
  ultrasounds: Ultrasounds;
  screenings: Screenings;
};
const AddBirthCalculation: React.FC<any> = () => {
  const [patient, setPatient] = useState<any>();
  const [dates, setDates] = useState<Data | null>(null);
  const [form, setForm] = useState({
    type: "",
    date: null,
    weeks: 0,
    days: 0,
  });
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbarStore();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isViewMode = searchParams.get("see") === "true";
  const isAddMode = !id;
  const addMutation = addGlobal({} as any, birthCalculatorApiClient);
  const updateMutation = updateItem({} as any, birthCalculatorApiClient);
  const handleChange = useCallback((name, value) => {
    setForm((oldState) => ({ ...oldState, [name]: value }));
  }, []);

  const { data: calculation, isLoading } = id
    ? getGlobalById(
        {},
        [CACHE_KEY_birthCalculator, id],
        birthCalculatorApiClient,
        undefined,
        parseInt(id)
      )
    : { data: {}, isLoading: false };
  const handleCalc = useCallback(() => {
    const { type, date, weeks, days } = form;

    if ((!date && !weeks && !days) || !type) return;

    let target = moment(date);
    if (weeks || days) {
      target = moment().subtract(weeks * 7 + days, "days");
    }

    const lastPeriod = TIMES.FN[type](target);
    const pregnancyStartDate = moment(lastPeriod).add(TIMES.START, "days");
    const dueDate = moment(lastPeriod).add(TIMES.DUE, "days");
    const postTermDate = moment(dueDate).add(TIMES.POST, "days");

    const pregnancyAgeInDays = moment().diff(lastPeriod, "days");
    const pregnancyAgeInWeeks = Math.floor(pregnancyAgeInDays / 7);
    const pregnancyAgeInRemainingDays = pregnancyAgeInDays % 7;

    const consultations = {
      "1ere": moment(pregnancyStartDate).add(6, "weeks").format("YYYY-MM-DD"),
      "2eme": moment(pregnancyStartDate).add(12, "weeks").format("YYYY-MM-DD"),
      "3eme": moment(pregnancyStartDate).add(20, "weeks").format("YYYY-MM-DD"),
    };

    for (let week = 28; week <= 40; week += 4) {
      consultations[Object.keys(consultations).length + 1 + "eme"] = moment(
        pregnancyStartDate
      )
        .add(week, "weeks")
        .format("YYYY-MM-DD");
    }

    const ultrasounds = {
      "1ere": {
        start: moment(pregnancyStartDate).add(11, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(14, "weeks").format("YYYY-MM-DD"),
      },
      "2eme": {
        start: moment(pregnancyStartDate).add(18, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(22, "weeks").format("YYYY-MM-DD"),
      },
      "3eme": {
        start: moment(pregnancyStartDate).add(30, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(34, "weeks").format("YYYY-MM-DD"),
      },
    };

    const screenings = {
      extra: [
        {
          start: moment(pregnancyStartDate)
            .add(12, "weeks")
            .format("YYYY-MM-DD"),
          end: moment(pregnancyStartDate).add(15, "weeks").format("YYYY-MM-DD"),
        },
        {
          start: moment(pregnancyStartDate)
            .add(15, "weeks")
            .add(1, "days")
            .format("YYYY-MM-DD"),
          end: moment(pregnancyStartDate).add(24, "weeks").format("YYYY-MM-DD"),
        },
      ],
      hgpo: {
        start: moment(pregnancyStartDate).add(24, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(28, "weeks").format("YYYY-MM-DD"),
      },
      rhophylac: {
        start: moment(pregnancyStartDate).add(28, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(30, "weeks").format("YYYY-MM-DD"),
      },
      swab: {
        start: moment(pregnancyStartDate).add(35, "weeks").format("YYYY-MM-DD"),
        end: moment(pregnancyStartDate).add(37, "weeks").format("YYYY-MM-DD"),
      },
    };

    setDates({
      lastPeriod: lastPeriod.format("YYYY-MM-DD"),
      startOfPregnancy: pregnancyStartDate.format("YYYY-MM-DD"),
      dueDate: dueDate.format("YYYY-MM-DD"),
      postTermDate: postTermDate.format("YYYY-MM-DD"),
      consultations,
      ultrasounds,
      screenings,
      pregnancyAge: {
        age: pregnancyAgeInDays,
        weeks: pregnancyAgeInWeeks,
        days: pregnancyAgeInRemainingDays,
      },
    });
  }, [form]);
  const createAction = useCallback(
    async (formData) => {
      return await addMutation.mutateAsync(formData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["birthCalculators"] });
          showSnackbar("Le calcul a été enregistré", "success");
        },
        onError: (error: any) => {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message
              : error.message;
          showSnackbar(message, "warning");
        },
      });
    },
    [addMutation, queryClient, showSnackbar]
  );

  const editUser = useCallback(
    async (formData: any, id: number) => {
      await updateMutation.mutateAsync(
        { data: formData, id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["birthCalculator"] });
            showSnackbar("Le calcul a été modifié", "info");
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
    },
    [updateMutation, queryClient, showSnackbar]
  );

  const handleSubmit = useCallback(async () => {
    const { type, date, weeks, days } = form;
    if ((!date && !weeks && !days) || !type) return;

    const data = {
      date: date?.format("YYYY-MM-DD"),
      weeks,
      days,
      type,
    };
    const formData = { ...data, patient_id: patient.id };

    try {
      if (isAddMode) {
        await createAction(formData);
      } else {
        await editUser(formData, parseInt(id));
      }
    } catch (error) {}
  }, [form, patient, isAddMode, id, createAction, editUser]);

  useEffect(() => {
    if (!isAddMode && calculation && calculation.patient?.id) {
      setPatient({
        id: calculation.patient.id,
        name: calculation.patient.full_name,
      });

      setForm({
        type: calculation.type,
        date: moment(calculation.date),
        weeks: calculation.weeks,
        days: calculation.days,
      });
    }
  }, [isAddMode, calculation]);
  useEffect(() => {
    handleCalc();
  }, [form]);
  if (isLoading) return <LoadingSpinner />;
  return (
    <Paper className="!p-6 w-full flex flex-col gap-4">
      <Box className="flex gap-6 flex-col">
        <Box className="flex justify-center">
          <Typography
            id="modal-modal-title"
            component="h2"
            className="text-center !text-2xl font-bold"
          >
            Calculation grossesse
          </Typography>
        </Box>
        <Box
          className={
            dates
              ? "grid grid-rows-1 grid-cols-1 lg:grid-cols-3 gap-12 items-start"
              : "flex lg:flex-wrap"
          }
        >
          <Box
            className={
              "flex flex-col gap-4 lg:sticky lg:top-24" +
              (dates ? "" : "  lg:w-1/2 lg:mx-auto")
            }
          >
            <PatientSearchAutocomplete
              setPatient={setPatient}
              defaultValue={patient}
              label="Rechercher un patient"
            />
            <FormControl className="w-full">
              <InputLabel id="select-label">Type</InputLabel>
              <Select
                labelId="select-label"
                label="Type"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <MenuItem value="LP">Dernières règles</MenuItem>
                <MenuItem value="PS">Début de grossesse</MenuItem>
                <MenuItem value="PD">Terme de la grossesse</MenuItem>
              </Select>
            </FormControl>
            <FormControl className="w-full">
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  value={form.date ?? null}
                  label="Date"
                  onChange={(value) => handleChange("date", value)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: false, // <- disables error state even if date is empty
                    },
                  }}
                />
              </LocalizationProvider>
            </FormControl>
            <Box className="flex flex-wrap items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <label className="w-max">ou</label>
              <div className="flex-1 h-px bg-gray-300"></div>
            </Box>
            <Box className="flex flex-wrap items-center gap-4">
              <TextField
                type="number"
                className="flex-1"
                value={form.weeks}
                onChange={(e) => handleChange("weeks", +e.target.value || 0)}
              />
              <label className="w-max">semaine(s)</label>
              <TextField
                type="number"
                className="flex-1"
                value={form.days}
                onChange={(e) => handleChange("days", +e.target.value || 0)}
              />
              <label className="w-max">jour(s)</label>
            </Box>
          </Box>
          <Box className="lg:col-span-2">
            {dates && (
              <Box className="flex flex-col gap-10">
                <Box className="flex flex-col gap-4">
                  <Box className="flex justify-start">
                    <Typography
                      id="modal-modal-title"
                      component="h2"
                      className="text-start !text-xl font-bold"
                    >
                      Dates importantes
                    </Typography>
                  </Box>
                  <Box className="grid grid-rows-1 grid-cols-1 lg:grid-cols-2 gap-4">
                    <Box className="w-full flex flex-col gap-2 lg:col-span-2">
                      <label className="w-full">Age de la grossesse</label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {`${dates.pregnancyAge.weeks} semaines ${dates.pregnancyAge.days} jours (${dates.pregnancyAge.age} jours)`}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Date des dernières règles
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.lastPeriod}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Date du début de la grossesse
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.startOfPregnancy}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Date du terme de la grossesse
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.dueDate}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Date post-terme de la grossesse
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.postTermDate}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box className="flex flex-col gap-4">
                  <Box className="flex justify-start">
                    <Typography
                      id="modal-modal-title"
                      component="h2"
                      className="text-start !text-xl font-bold"
                    >
                      Consultations
                    </Typography>
                  </Box>
                  <Box className="grid grid-rows-1 grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.keys(dates.consultations).map((key, index) => (
                      <Box
                        key={"Consultations_" + index}
                        className="w-full flex flex-col gap-2"
                      >
                        <label className="w-full">
                          {key} consultation avant le
                        </label>
                        <Box className="px-6 py-4 border rounded-md border-gray-300">
                          {dates.consultations[key]}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box className="flex flex-col gap-4">
                  <Box className="flex justify-start">
                    <Typography
                      id="modal-modal-title"
                      component="h2"
                      className="text-start !text-xl font-bold"
                    >
                      Echographie
                    </Typography>
                  </Box>
                  <Box className="grid grid-rows-1 grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.keys(dates.ultrasounds).map((key, index) => (
                      <React.Fragment key={"Echographie_" + index}>
                        <Box className="w-full flex flex-col gap-2">
                          <label className="w-full">
                            {key} échographie au plus tôt
                          </label>
                          <Box className="px-6 py-4 border rounded-md border-gray-300">
                            {dates.ultrasounds[key].start}
                          </Box>
                        </Box>
                        <Box className="w-full flex flex-col gap-2">
                          <label className="w-full">
                            {key} échographie au plus tard
                          </label>
                          <Box className="px-6 py-4 border rounded-md border-gray-300">
                            {dates.ultrasounds[key].end}
                          </Box>
                        </Box>
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
                <Box className="flex flex-col gap-4">
                  <Box className="flex justify-start">
                    <Typography
                      id="modal-modal-title"
                      component="h2"
                      className="text-start !text-xl font-bold"
                    >
                      Dépistages
                    </Typography>
                  </Box>
                  <Box className="grid grid-rows-1 grid-cols-1 lg:grid-cols-2 gap-4">
                    {dates.screenings.extra.map((obj, index) => (
                      <React.Fragment key={"Dépistages_" + index}>
                        <Box className="w-full flex flex-col gap-2">
                          <label className="w-full">
                            HT21 (Trimestre {index + 1}) au plus tôt
                          </label>
                          <Box className="px-6 py-4 border rounded-md border-gray-300">
                            {obj.start}
                          </Box>
                        </Box>
                        <Box className="w-full flex flex-col gap-2">
                          <label className="w-full">
                            HT21 (Trimestre {index + 1}) au plus tard
                          </label>
                          <Box className="px-6 py-4 border rounded-md border-gray-300">
                            {obj.end}
                          </Box>
                        </Box>
                      </React.Fragment>
                    ))}
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">HGPO au plus tôt</label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.hgpo.start}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">HGPO au plus tard</label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.hgpo.end}
                      </Box>
                    </Box>

                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">Rhophylac au plus tôt</label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.rhophylac.start}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">Rhophylac au plus tard</label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.rhophylac.end}
                      </Box>
                    </Box>

                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Prélèvement vaginal au plus tôt
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.swab.start}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2">
                      <label className="w-full">
                        Prélèvement vaginal au plus tard
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.screenings.swab.end}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        {!isViewMode &&
          form.type &&
          (form.date || form.weeks > 0 || form.days > 0) && (
            <Box className="flex justify-between flex-row content-center">
              <Button
                type="submit"
                variant="contained"
                onClick={handleSubmit}
                className="w-full md:w-max !px-10 !py-3 rounded-lg !ms-auto"
              >
                Enregistrer
              </Button>
            </Box>
          )}
      </Box>
    </Paper>
  );
};

export default AddBirthCalculation;
