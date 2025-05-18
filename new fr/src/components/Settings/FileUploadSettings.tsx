import {
  Box,
  Button,
  IconButton,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useCallback, useRef, useState } from "react";
import { useSnackbarStore } from "../../zustand/useSnackbarStore";
import { AxiosError } from "axios";
import getGlobal from "../../hooks/getGlobal";
import { CACHE_KEY_getDoctorFiles } from "../../constants";
import LoadingSpinner from "../LoadingSpinner";
import deleteItem from "../../hooks/deleteItem";
import addGlobal from "../../hooks/addGlobal";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  getDoctorFileApiClient,
  storeDoctorFileApiClient,
  deleteDoctorFileApiClient,
} from "../../services/DoctorFileUpload";

const FileUploadSettings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { data, isLoading, refetch } = getGlobal(
    {} as any,
    [CACHE_KEY_getDoctorFiles],
    getDoctorFileApiClient,
    undefined
  );
  const { showSnackbar } = useSnackbarStore();

  const addMutation = addGlobal({} as any, storeDoctorFileApiClient, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: any) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );

      setUploadProgress(percentCompleted);
    },
  });
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedExtensions = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedExtensions.includes(file.type)) {
        showSnackbar(
          `"${file.name}" n'est pas un fichier valide. Seuls les fichiers PDF et Word sont autorisés.`,
          "error"
        );
      } else {
        newFiles.push(file);
      }
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
      showSnackbar("Fichier(s) ajouté(s) avec succès.", "success");
    }
  };
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar(
        "Veuillez sélectionner un fichier avant d'ajouter.",
        "error"
      );
      return;
    }

    // Create FormData to send files properly
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files[]", file); // Use files[] array format
    });

    await addMutation.mutateAsync(
      formData, // Pass FormData
      {
        onSuccess: () => {
          showSnackbar("Fichiers téléchargés avec succès", "success");
          setSelectedFiles([]);
          refetch();
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
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const deleteFile = useCallback(async ($id: number) => {
    const roledelte = await deleteItem($id, deleteDoctorFileApiClient);
    if (roledelte) {
      showSnackbar("Le Fichier  a été supprimé.", "info");
      refetch();
    } else {
      showSnackbar("Oups, quelque chose s'est mal passé.", "error");
    }
  }, []);
  if (isLoading) return <LoadingSpinner />;

  return (
    <Box className="flex flex-col w-full gap-6" component="form">
      <Box className="flex justify-center">
        <Typography className="text-center !text-2xl font-medium">
          Gestion des fichiers
        </Typography>
      </Box>

      <Box className="flex flex-col md:flex-row gap-4 flex-wrap">
        <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center">
          <label htmlFor="fileUpload" className="w-full md:w-[200px]">
            Importer des documents:
          </label>

          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Importer des fichiers
            <VisuallyHiddenInput
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.doc,.docx"
            />
          </Button>
        </Box>
      </Box>
      <Box className=" flex flex-wrap w-full">
        {selectedFiles.length > 0 && (
          <Box className=" flex flex-wrap gap-1">
            {selectedFiles.map((file, index) => (
              <Box
                key={index}
                className="flex items-center gap-2 bg-gray-200 p-2 rounded-md"
              >
                <Typography className="text-sm">{file.name}</Typography>
                <IconButton size="small" onClick={() => removeFile(index)}>
                  <DeleteOutlineIcon color="error" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Box className="flex">
        <Button
          onClick={handleFileUpload}
          disabled={uploadProgress > 0 && uploadProgress < 100}
          variant="contained"
          className="w-full md:w-max !px-10 !py-3 rounded-lg !ms-auto"
        >
          {uploadProgress > 0 && uploadProgress < 100 ? (
            <div role="status" className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="text-lg">{uploadProgress}%</span>
            </div>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </Box>

      <Box className="w-full flex flex-col gap-2 md:flex-row md:flex-wrap items-center mt-2">
        <TableContainer
          component={Paper}
          elevation={0}
          className="border border-gray-300"
        >
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell>Nom du fichier</TableCell>
                <TableCell>Date d'ajout</TableCell>
                <TableCell width={60} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.length ? (
                data.map((row, index) => (
                  <TableRow key={index} className="border-t border-gray-300">
                    <TableCell component="th" scope="row">
                      {row.filename}
                    </TableCell>
                    <TableCell>{row.created_at}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => deleteFile(row.id)}>
                        <DeleteOutlineIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-t border-gray-300">
                  <TableCell
                    colSpan={3}
                    align="center"
                    className="!text-gray-600 p-4"
                  >
                    <p className="text-lg">Aucun fichier disponible.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});
export default FileUploadSettings;
