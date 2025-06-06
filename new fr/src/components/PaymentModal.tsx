import {
  Modal,
  Box,
  Button,
  TextField,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LoadingSpinner from "./LoadingSpinner";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  CACHE_KEY_Hospitaloperations,
  CACHE_KEY_Operation,
  CACHE_KEY_OperationDetail,
} from "../constants";
import getGlobalById from "../hooks/getGlobalById";
import operationDetailsApiClient, {
  OperationDetail,
  deleteoperationdetailsApiclient,
} from "../services/OperationDetailsService";
import updateItem from "../hooks/updateItem";
import operationApiClient, { Operation } from "../services/OperationService";
import deleteItem from "../hooks/deleteItem";
import { useSnackbarStore } from "../zustand/useSnackbarStore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface ModalComponentProps {
  open: boolean;
  onClose: () => void;
  operationID: number | null;
}
interface FormData {
  amount_paid: number;
  // Add other form fields here
}
const PaymentModal = ({ open, onClose, operationID }: ModalComponentProps) => {
  const { handleSubmit, control, setValue } = useForm<FormData>();
  const [fetchedoperations, setFetchedOperations] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isOutsource, setIsOutsource] = useState<boolean>(false);
  const addMutation = updateItem<Operation>(
    {} as Operation,
    operationApiClient
  );
  const { showSnackbar } = useSnackbarStore();
  const queryClient = useQueryClient();
  if (!operationID) return null;

  const { data, isLoading, refetch } = getGlobalById(
    {} as OperationDetail,
    [CACHE_KEY_OperationDetail, operationID.toString()],
    operationDetailsApiClient,
    undefined,
    operationID
  );

  useEffect(() => {
    if (data) {
      setFetchedOperations(data.payments);

      // Check if this is an outsourced operation
      setIsOutsource(data.outsource === 1);

      if (data.outsource === 1) {
        // Use fee for external operations
        const externalFee = data.externalOperation.reduce(
          (total: number, external: any) => total + Number(external.fee),
          0
        );

        setTotalCost(externalFee);
      } else {
        // Calculate total cost for regular operations
        const operationDetailsCost = data.operation_details.reduce(
          (total: number, detail: any) => total + Number(detail.price),
          0
        );

        const xraysCost = data.xrays.reduce(
          (total: number, xray: any) => total + Number(xray.price),
          0
        );

        setTotalCost(operationDetailsCost + xraysCost);
      }
    }
  }, [data]);
  //TODO: remove only operation with the specify id

  if (isLoading) return <LoadingSpinner />;
  const onSubmit = async (data: FormData) => {
    if (data) {
      if (totalpaid + Number(data.amount_paid) > totalCost) {
        showSnackbar("Le paiement total dépasse le coût total.");
        return;
      }

      await addMutation
        .mutateAsync(
          //@ts-ignore
          { data, id: operationID },
          {
            onSuccess(data: any) {
              queryClient.invalidateQueries([
                CACHE_KEY_OperationDetail,
                operationID.toString(),
              ]);
              queryClient.invalidateQueries(CACHE_KEY_Operation, {
                exact: false,
              });
              queryClient.invalidateQueries(CACHE_KEY_Hospitaloperations, {
                exact: false,
              });

              setFetchedOperations((prevData) => [
                ...prevData,
                {
                  amount_paid: data.amount_paid,
                  date: data.date,
                  id: data.id,
                },
              ]);
              //@ts-ignore
              setValue("amount_paid", "");
            },

            onError(error) {
              console.log(error);
            },
          }
        )
        .catch((error) => {
          console.error("onError", error);
        });
    }
  };

  const totalpaid = fetchedoperations.reduce(
    (total, payment) => total + parseFloat(payment.amount_paid || "0"),
    0
  );

  const outstandingAmount = totalCost - totalpaid;

  const deletePayment = async (id: number) => {
    try {
      const deletionSuccessful = await deleteItem(
        id,
        deleteoperationdetailsApiclient
      );

      if (deletionSuccessful) {
        refetch();
        /* queryClient.invalidateQueries([CACHE_KEY_OperationDetail, id]); */
        showSnackbar("La suppression du paiement a réussi", "success");
      } else {
        showSnackbar("La suppression du paiement a échoué", "error");
      }
    } catch (error) {
      showSnackbar(
        `Une erreur s'est produite lors de la suppression du paiement :${error}`,
        "error"
      );
      console.log(error);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className="flex justify-center items-center p-4"
    >
      <Paper elevation={5} sx={{ width: 600 }}>
        <Box sx={{ bgcolor: "background.paper" }} className="rounded-lg w-full">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className="!rounded-lg border bg-card text-card-foreground shadow-sm mx-auto"
          >
            <Box className="flex flex-col gap-6 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                Détails du paiement des patients
              </h3>
              <Box className="flex flex-col gap-2">
                <Table aria-label="simple table" className="!border-t-0">
                  <TableHead>
                    <TableRow>
                      <TableCell className="!px-2 !py-1 !font-semibold !text-base !border-0">
                        Opération
                      </TableCell>
                      <TableCell
                        className="!px-2 !py-1 !font-semibold !text-base !border-0"
                        align="right"
                      >
                        Prix
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.operation_details?.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="!px-2 !py-1 !border-0">
                          {row.operation_type || "No Operation Name"}
                        </TableCell>
                        <TableCell
                          className="!px-2 !py-1 !border-0"
                          align="right"
                        >
                          {row.price} MAD
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.xrays?.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="!px-2 !py-1 !border-0">
                          {row.xray_type.join(", ") || "No X-Ray Type"}
                        </TableCell>
                        <TableCell
                          className="!px-2 !py-1 !border-0"
                          align="right"
                        >
                          {row.price} MAD
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.externalOperation?.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="!px-2 !py-1 !border-0">
                          {row.operation_type || "No X-Ray Type"}
                        </TableCell>
                        <TableCell
                          className="!px-2 !py-1 !border-0"
                          align="right"
                        >
                          {row.fee} MAD
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* <Box className="flex items-center justify-between">
                  <span className="font-semibold text-base text-start">
                    Opération
                  </span>
                  <span className="font-semibold text-base text-end">Prix</span>
                </Box>
                <Box className="flex flex-col gap-1">
                  {data?.operation_details?.map((detail: any, i: number) => (
                    <Box className="flex items-center justify-between" key={i}>
                      <span className="text-gray-500 text-base text-start">
                        {detail.operation_type || "No Operation Name"}
                      </span>
                      <span className="text-gray-500 text-sm text-end">
                        {detail.price} MAD
                      </span>
                    </Box>
                  ))}
                  {data?.xrays?.map((xray: any, i: number) => (
                    <Box
                      className="flex items-center justify-between"
                      key={`xray-${i}`}
                    >
                      <span className="text-gray-500 text-base text-start">
                        {xray.xray_type.join(", ") || "No X-Ray Type"}
                      </span>
                      <span className="text-gray-500 text-sm text-end">
                        {xray.price} MAD
                      </span>
                    </Box>
                  ))}
                  {data?.externalOperation?.map((external: any, i: number) => (
                    <Box
                      className="flex items-center justify-between"
                      key={`outsource-${i}`}
                    >
                      <span className="text-gray-500 text-base text-start">
                        {external.operation_type || "No X-Ray Type"}
                      </span>
                      <span className="text-gray-500 text-sm text-end">
                        {external.fee} MAD
                      </span>
                    </Box>
                  ))}
                </Box> */}
              </Box>
              <Box className="flex flex-col gap-2">
                <Table aria-label="simple table" className="!border-t-0">
                  <TableHead>
                    <TableRow>
                      <TableCell className="!px-2 !py-1 !font-semibold !text-base !border-0">
                        Paiements
                      </TableCell>
                      <TableCell className="!px-2 !py-1 !font-semibold !text-base !border-0">
                        Prix
                      </TableCell>
                      <TableCell className="!px-2 !py-1 !font-semibold !text-base !border-0">
                        Date
                      </TableCell>
                      <TableCell
                        className="!px-2 !py-1 !font-semibold !text-base !border-0"
                        width={60}
                        align="center"
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fetchedoperations?.length ? (
                      fetchedoperations.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="!px-2 !py-1 !border-0">
                            Paiment {index + 1}
                          </TableCell>
                          <TableCell className="!px-2 !py-1 !border-0">
                            {row.amount_paid === null
                              ? "0.00"
                              : row.amount_paid}{" "}
                            MAD
                          </TableCell>
                          <TableCell className="!px-2 !py-1 !border-0">
                            {row.date}
                          </TableCell>
                          <TableCell
                            className="!px-2 !py-1 !border-0"
                            align="center"
                          >
                            <IconButton onClick={() => deletePayment(row.id)}>
                              <DeleteOutlineIcon
                                color="error"
                                className="pointer-events-none"
                                fill="currentColor"
                              />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-t border-gray-300">
                        <TableCell
                          colSpan={4}
                          align="center"
                          className="!text-gray-600 p-4"
                        >
                          <p className="text-lg">
                            Désolé, aucun paiement pour le moment.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* <Box className="flex justify-between items-center">
                    <h2 className="font-semibold text-base text-start w-1/3">
                      Paiements
                    </h2>
                    <h2 className="font-semibold text-base text-center w-1/3">
                      Prix
                    </h2>
                    <h2 className="font-semibold text-base text-end w-1/3">
                      Date
                    </h2>
                    <h2 className="font-semibold text-base text-end w-1/3">
                      Action
                    </h2>
                  </Box>
                  <Box className="flex flex-col gap-1">
                    {fetchedoperations?.map((payment: any, j: number) => {
                      return (
                        <Box
                          className="flex items-center justify-between"
                          key={j}
                        >
                          <span className="text-gray-500 text-base text-start w-1/3">
                            Payment {j + 1}
                          </span>
                          <span className="text-gray-500 text-sm text-center w-1/3">
                            {payment.amount_paid === null
                              ? "0.00"
                              : payment.amount_paid}{" "}
                            MAD
                          </span>
                          <span className="text-gray-500 text-sm text-end w-1/3">
                            {payment.date}
                          </span>
                          <IconButton
                            aria-label="delete"
                            color="error"
                            onClick={() => deletePayment(payment.id)}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box> */}
              </Box>
              {outstandingAmount ? (
                <Box className="flex items-center flex-wrap gap-4">
                  <Controller
                    //@ts-ignore
                    defaultValue=""
                    name="amount_paid"
                    control={control}
                    rules={{
                      required: "Le montant est requis",
                      validate: (value) =>
                        value > 0 || "Le montant doit être un nombre positif",
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        className="flex-1"
                        id="amount_paid"
                        label="Montant"
                        variant="outlined"
                        type="number"
                        size="small"
                        placeholder="Enter Montant"
                        error={!!error}
                        helperText={error ? error.message : ""}
                        {...field}
                      />
                    )}
                  />
                  <Button variant="outlined" type="submit">
                    {addMutation.isLoading ? "..." : "Ajouter"}
                  </Button>
                </Box>
              ) : (
                ""
              )}
              <Box className="flex justify-between items-center">
                <h2 className="font-semibold text-base text-start">
                  Montant restant
                </h2>
                <span className="font-semibold text-sm text-end">{`${outstandingAmount.toFixed(
                  2
                )} MAD `}</span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};

export default PaymentModal;
