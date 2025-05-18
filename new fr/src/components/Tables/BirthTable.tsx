import Tooltip from "@mui/material/Tooltip";
import { IconButton, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";
import { CACHE_KEY_birthCalculators } from "../../constants";
import { confirmDialog } from "../ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";

import deleteItem from "../../hooks/deleteItem";
import DataTable from "../DataTable";
import getGlobalv2 from "../../hooks/getGlobalv2";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { birthCalculatorApiClient } from "../../services/Birthcalculator";

const BirthTable = () => {
  const { showSnackbar } = useSnackbarStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const columns = [
    {
      name: "id",
      label: "#",
      options: {
        display: false,
      },
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
      name: "type",
      label: "Type",
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
          return (
            <Box className="w-max">
              <Tooltip title="Modifier le calcul">
                <IconButton className="btn-ordonance-edit text-gray-950 hover:text-blue-700 cursor-pointer">
                  <EditOutlinedIcon
                    className="pointer-events-none"
                    fill="currentColor"
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title="Supprimer le calcul">
                <IconButton className="btn-ordonance-delete text-gray-950 hover:text-red-700 cursor-pointer">
                  <DeleteOutlineIcon
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
      CACHE_KEY_birthCalculators,
      birthCalculatorApiClient,
      page,
      rowsPerPage,
      searchQuery,

      {
        staleTime: 60000,
        cacheTime: 300000,
      }
    );

  return (
    <Box className="relative">
      <DataTable
        title="Liste des calculs"
        noMatchMessage="Désolé, aucun calcul n'est dans nos données"
        columns={columns}
        dataHook={dataHook}
        options={{
          searchPlaceholder: "Rechercher un calcul",
          customToolbar: () => {
            return (
              <Tooltip title="Nouveau calcul">
                <IconButton onClick={() => navigate(`/ajouter-calculateur`)}>
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
              navigate(`/ajouter-calculateur?id=${s[0]}`);
            } else if (
              e.target.querySelector(".btn-ordonance-delete") ||
              e.target.classList.contains("btn-ordonance-delete")
            ) {
              // api
              confirmDialog(
                "Voulez-vous vraiment supprimer le calcul ?",
                async () => {
                  try {
                    const deletionSuccessful = await deleteItem(
                      s[0],
                      birthCalculatorApiClient
                    );
                    if (deletionSuccessful) {
                      queryClient.invalidateQueries(CACHE_KEY_birthCalculators);

                      showSnackbar(
                        "La suppression du calcul a réussi",
                        "success"
                      );
                    } else {
                      showSnackbar(
                        "La suppression du calcul a échoué",
                        "error"
                      );
                    }
                  } catch (error) {
                    showSnackbar(
                      `Une erreur s'est produite lors de la suppression du calcul:${error}`,
                      "error"
                    );
                  }
                }
              );
            } else {
              navigate(`/ajouter-calculateur?id=${s[0]}&see=true`);
            }
          },
        }}
      />
    </Box>
  );
};

export default BirthTable;
