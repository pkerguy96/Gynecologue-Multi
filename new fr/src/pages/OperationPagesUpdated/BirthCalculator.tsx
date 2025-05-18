//@ts-nocheck
import { CliniquerensignementProps } from "./Cliniquerensignement";
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
import React, { useEffect } from "react";
import { useState } from "react";

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

type Data = {
  lastPeriod: string;
  startOfPregnancy: string;
  dueDate: string;
  postTermDate: string;
  declaration: string;
  pregnancyAge: Age;
  consultations: object;
  ultrasounds: object;
  screenings: object;
};

const BirthCalculator: React.FC<CliniquerensignementProps> = ({
  onNext,
  onBack,
}) => {
  const [dates, setDates] = useState<Data | boolean>(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    type: "",
    date: null,
    weeks: 0,
    days: 0,
  });

  const handleChange = (name, value) => {
    setForm((oldState) => ({ ...oldState, [name]: value }));
  };

  const handleCalc = () => {
    const { type, date, weeks, days } = form;

    if ((!date && !weeks && !days) || !type) return;

    let target = moment(date);

    if (weeks || days) {
      target = moment().subtract(weeks * 7 + days, "days");
      console.log("Using calculated target date");
    }

    console.log(target, TIMES.FN[type](target));

    const lastPeriod = TIMES.FN[type](target);
    const pregnancyStartDate = moment(lastPeriod).add(TIMES.START, "days");
    const dueDate = moment(lastPeriod).add(TIMES.DUE, "days");
    const postTermDate = moment(dueDate).add(TIMES.POST, "days");
    const declaration = moment(pregnancyStartDate).add(TIMES.INFO, "days");

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
      declaration: declaration.format("YYYY-MM-DD"),
      consultations: consultations,
      ultrasounds: ultrasounds,
      screenings: screenings,
      pregnancyAge: {
        age: pregnancyAgeInDays,
        weeks: pregnancyAgeInWeeks,
        days: pregnancyAgeInRemainingDays,
      },
    });
  };

  const handleSubmit = () => {
    const { type, date, weeks, days } = form;

    if ((!date && !weeks && !days) || !type) return;

    const data = {
      date: date.format("YYYY-MM-DD"),
      status,
      weeks,
      days,
      type,
    };

    console.log(data);
  };

  useEffect(() => {
    handleCalc();
  }, [form, status]);

  // useEffect(() => {
  //   setForm({
  //     type: "LP",
  //     date: moment("2025-02-01"),
  //     weeks: 0,
  //     days: 0,
  //   });
  //   setStatus("twins");
  // }, []);

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
                  value={form.date}
                  label="Date"
                  onChange={(value) => handleChange("date", value)}
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
                <Box className="flex flex-col gap-4">
                  <Box className="flex justify-start">
                    <Typography
                      id="modal-modal-title"
                      component="h2"
                      className="text-start !text-xl font-bold"
                    >
                      Administratif
                    </Typography>
                  </Box>
                  <Box className="grid grid-rows-1 grid-cols-1 gap-4">
                    <Box className="w-full flex flex-col gap-2 lg:col-span-2">
                      <label className="w-full">
                        Déclaration de la grossesse avant le
                      </label>
                      <Box className="px-6 py-4 border rounded-md border-gray-300">
                        {dates.declaration}
                      </Box>
                    </Box>
                    <Box className="w-full flex flex-col gap-2 lg:col-span-2">
                      <label className="w-full">Statut de la grossesse</label>
                      <FormControl className="w-full">
                        <Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <MenuItem value="less_than_two">
                            Moins de 2 enfants à charge
                          </MenuItem>
                          <MenuItem value="more_than_two">
                            2 enfants ou plus à charge
                          </MenuItem>
                          <MenuItem value="twins">Jumeaux</MenuItem>
                          <MenuItem value="triplet">Triplets</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        <Box className="flex justify-between flex-row content-center">
          <Button
            className="w-full md:w-max !px-10 !py-3 rounded-lg "
            variant="outlined"
          >
            <p className="text-sm ">Passer</p>
          </Button>

          <Button
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            className="w-full md:w-max !px-10 !py-3 rounded-lg !ms-auto"
          >
            Enregistrer
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default BirthCalculator;
