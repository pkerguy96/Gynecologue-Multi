import MUIDataTable from "mui-datatables-mara";
import { Box } from "@mui/material";

import getGlobal from "../hooks/getGlobal";
import { CACHE_KEY_getDoctorFiles } from "../constants";
import { ClusterData } from "../services/UploadsService";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadForOfflineOutlinedIcon from "@mui/icons-material/DownloadForOfflineOutlined";
import deleteItem from "../hooks/deleteItem";
import { useSnackbarStore } from "../zustand/useSnackbarStore";

import { APIClient } from "../services/Http";
import { confirmDialog } from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  deleteDoctorFileApiClient,
  getDoctorFileApiClient,
} from "../services/DoctorFileUpload";

const DoctorFiles = () => {
  const { showSnackbar } = useSnackbarStore();
  const { data, isLoading, refetch } = getGlobal(
    {} as ClusterData,
    [CACHE_KEY_getDoctorFiles],
    getDoctorFileApiClient,
    undefined
  );

  const download = async (id) => {
    const apiClient = new APIClient<any>("/downloadFile");
    try {
      await apiClient.downloadfichier(id);
    } catch (error) {
      console.error("Error downloading ZIP:", error);
    }
  };

  const columns = [
    {
      name: "id",
      label: "#",
      options: {
        filter: false,
        sort: false,
        display: "excluded",
      },
    },

    {
      name: "filename",
      label: "Nom du fichier",
      options: {
        filter: true,
        sort: true,
      },
    },

    {
      name: "size",
      label: "Taille des fichiers",
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
      name: "created_at",
      label: "Date",
      options: {
        filter: true,
        sort: true,
      },
    },

    {
      name: "action",
      label: "Action",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (_value, tableMeta) => {
          const fileId = tableMeta.rowData[0];
          return (
            <>
              <button
                onClick={() => download(fileId)}
                className="btn-ordonance-download text-gray-950 hover:text-blue-700 cursor-pointer"
                title="Télécharger"
              >
                <DownloadForOfflineOutlinedIcon
                  className="pointer-events-none"
                  fill="currentColor"
                />
              </button>

              <button
                className="btn-ordonance-delete text-gray-950 hover:text-blue-700 cursor-pointer"
                title="Supprimer"
              >
                <DeleteOutlineIcon
                  color="error"
                  className="pointer-events-none"
                  fill="currentColor"
                />
              </button>
            </>
          );
        },
      },
    },
  ];
  const options = {
    filterType: "dropdown",
    selectableRowsHideCheckboxes: true,
    searchPlaceholder: "Rechercher un fichier",
    textLabels: {
      body: {
        noMatch: "Désolé, aucun fichier n'est dans nos données",
      },
    },

    onRowClick: async (s: any, _m: any, e: any) => {
      if (
        e.target.querySelector(".btn-ordonance-delete") ||
        e.target.classList.contains("btn-ordonance-delete")
      ) {
        confirmDialog(
          "Voulez-vous vraiment supprimer ce fichier?",
          async () => {
            const response = await deleteItem(s[0], deleteDoctorFileApiClient);
            if (response) {
              refetch();
              showSnackbar("le fichier a été supprimé avec succès", "success");
            } else {
              showSnackbar("La suppression du fichier a échoué", "error");
            }
          }
        );
      } else if (
        e.target.querySelector(".btn-ordonance-download") ||
        e.target.classList.contains("btn-ordonance-download")
      ) {
        try {
        } catch (error) {
          console.log(error);
        }
      }
    },
  };
  if (isLoading) return <LoadingSpinner />;
  return (
    <Box className="relative">
      <MUIDataTable
        title={"Gestion de fichiers"}
        data={data}
        columns={columns}
        options={options}
      />
    </Box>
  );
};

export default DoctorFiles;
