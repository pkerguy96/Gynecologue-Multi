import { Box, IconButton, Tooltip } from "@mui/material";
import DataTable from "../DataTable";
import AddIcon from "@mui/icons-material/Add";
import {
  deleteObservationApiClient,
  fetchobservations,
} from "../../services/CompteRenduService";
import getGlobalv2 from "../../hooks/getGlobalv2";
import { CACHE_KEY_Patientsobservation } from "../../constants";
import { confirmDialog } from "../ConfirmDialog";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import deleteItem from "../../hooks/deleteItem";
const ObservationTable = () => {
  const { showSnackbar } = useSnackbarStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const columns = [
    {
      name: "id",
      label: "#",
    },
    {
      name: "patient_id",
      label: "#",
      options: {
        display: false,
      },
    },

    {
      name: "patient_name",
      label: "Nom complet",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "created_at",
      label: "Date",
      options: {
        filter: true,
        sort: true,
      },
    },

    {
      name: "Actions",
      label: "Actions",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const patientDeletedAt = tableMeta.rowData[4];

          return (
            <Box className="w-max">
              <Tooltip title="Modifier l'observation clinique">
                <IconButton className="btn-ordonance-edit text-gray-950 hover:text-blue-700 cursor-pointer">
                  <EditOutlinedIcon
                    className="pointer-events-none"
                    fill="currentColor"
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title="Supprimer l'observation clinique">
                <IconButton className="btn-ordonance-delete text-gray-950 hover:text-red-700 cursor-pointer">
                  <DeleteOutlineIcon
                    color="inherit"
                    className="pointer-events-none"
                    fill="currentColor"
                    aria-hidden="false"
                  />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    },
  ];

  const dataHook = (page: number, searchQuery: string, rowsPerPage: number) =>
    getGlobalv2(
      {},
      CACHE_KEY_Patientsobservation,
      fetchobservations,
      page,
      rowsPerPage,
      searchQuery,

      undefined
    );

  return (
    <Box className="relative">
      <DataTable
        title="Liste des observations cliniques"
        noMatchMessage="Désolé, aucune observation clinique n'est disponible dans nos données."
        columns={columns}
        dataHook={dataHook}
        options={{
          searchPlaceholder: "Rechercher une observation clinique",
          customToolbar: () => {
            return (
              <Tooltip title="Nouveau observation clinique">
                <IconButton onClick={() => navigate(`/Ajouter-observation`)}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            );
          },

          selectableRowsHideCheckboxes: true,
          onRowClick: (s: any, _m: any, e: any) => {
            if (
              e.target.querySelector(".btn-ordonance-edit") ||
              e.target.classList.contains("btn-ordonance-edit")
            ) {
              navigate(`/Ajouter-observation?obsID=${s[0]}&id=${s[1]}`);
            } else if (
              e.target.querySelector(".btn-ordonance-delete") ||
              e.target.classList.contains("btn-ordonance-delete")
            ) {
              // api
              confirmDialog(
                "Voulez-vous vraiment supprimer l'observation clinique ?",
                async () => {
                  try {
                    const deletionSuccessful = await deleteItem(
                      s[0],
                      deleteObservationApiClient
                    );
                    if (deletionSuccessful) {
                      queryClient.invalidateQueries(
                        CACHE_KEY_Patientsobservation
                      );

                      showSnackbar(
                        "La suppression d'observation clinique a réussi",
                        "success"
                      );
                    } else {
                      showSnackbar(
                        "La suppression d'observation clinique a échoué",
                        "error"
                      );
                    }
                  } catch (error) {
                    showSnackbar(
                      `Une erreur s'est produite lors de la suppression d'observation clinique:${error}`,
                      "error"
                    );
                  }
                }
              );
            } else {
              navigate(`/observation-details?obsID=${s[0]}&id=${s[1]}`);
            }
          },
        }}
      />
    </Box>
  );
};

export default ObservationTable;
