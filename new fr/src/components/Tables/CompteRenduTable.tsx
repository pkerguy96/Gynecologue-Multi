import { Box, IconButton, Tooltip } from "@mui/material";

import DataTable from "../DataTable";
import AddIcon from "@mui/icons-material/Add";
import getGlobalv2 from "../../hooks/getGlobalv2";
import { CACHE_KEY_CompteRendu } from "../../constants";
import { confirmDialog } from "../ConfirmDialog";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import deleteItem from "../../hooks/deleteItem";
import { fetchCompteRendu } from "../../services/CompteRenduService";
const CompteRenduTable = () => {
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
      name: "date",
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
              <Tooltip title="Modifier le compte rendu">
                <IconButton className="btn-ordonance-edit text-gray-950 hover:text-blue-700 cursor-pointer">
                  <EditOutlinedIcon
                    className="pointer-events-none"
                    fill="currentColor"
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title="Supprimer le compte rendu">
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
      CACHE_KEY_CompteRendu,
      fetchCompteRendu,
      page,
      rowsPerPage,
      searchQuery,
      undefined
    );

  return (
    <Box className="relative">
      <DataTable
        title="Liste des comptes rendus"
        noMatchMessage="Désolé, aucun compte rendu n'est disponible dans nos données."
        columns={columns}
        dataHook={dataHook}
        options={{
          searchPlaceholder: "Rechercher un compte rendu",
          customToolbar: () => {
            return (
              <Tooltip title="Nouveau compte rendu">
                <IconButton
                  onClick={() => navigate(`/Ajouter-rendu?direct=true`)}
                >
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
              navigate(`/Ajouter-rendu?renduID=${s[0]}&id=${s[1]}`);
            } else if (
              e.target.querySelector(".btn-ordonance-delete") ||
              e.target.classList.contains("btn-ordonance-delete")
            ) {
              // api
              confirmDialog(
                "Voulez-vous vraiment supprimer le compte rendu ?",
                async () => {
                  try {
                    const deletionSuccessful = await deleteItem(
                      s[0],
                      fetchCompteRendu
                    );
                    if (deletionSuccessful) {
                      queryClient.invalidateQueries(CACHE_KEY_CompteRendu);

                      showSnackbar(
                        "La suppression du compte rendu a réussi",
                        "success"
                      );
                    } else {
                      showSnackbar(
                        "La suppression du compte rendu a échoué",
                        "error"
                      );
                    }
                  } catch (error) {
                    showSnackbar(
                      `Une erreur s'est produite lors de la suppression du compte rendu:${error}`,
                      "error"
                    );
                  }
                }
              );
            } else {
              navigate(`/Compte-rendu-details?renduID=${s[0]}&id=${s[1]}`);
            }
          },
        }}
      />
    </Box>
  );
};

export default CompteRenduTable;
