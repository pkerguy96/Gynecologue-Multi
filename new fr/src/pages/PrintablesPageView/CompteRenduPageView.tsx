import { Box, Button, Paper, Typography } from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { useSearchParams } from "react-router-dom";
import getGlobalById from "../../hooks/getGlobalById";
import {
  CACHE_KEY_PatientCompteRendu,
  CACHE_KEY_PatienttinyData,
} from "../../constants";
import { fetchCompteRendu } from "../../services/CompteRenduService";
import { patientTinyDataAPIClient } from "../../services/PatientService";
import LoadingSpinner from "../../components/LoadingSpinner";
import RichEditorPrint from "../RichEditorPrint";

const CompteRenduPageView = () => {
  const { print, Printable } = RichEditorPrint();

  const [searchParams] = useSearchParams();
  const renduID = searchParams.get("renduID");
  const id = searchParams.get("id");

  const { data, isLoading } = renduID
    ? getGlobalById(
        {},
        [CACHE_KEY_PatientCompteRendu, renduID],
        fetchCompteRendu,
        undefined,
        parseInt(renduID)
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
  if (isLoading || isLoading2) return <LoadingSpinner />;
  return (
    <Paper>
      <Box className="w-full flex flex-col gap-4 bg-white rounded-sm p-4 relative z-[1]">
        <Box>
          <Typography
            variant="h4"
            className="text-center font-extrabold text-black"
          >
            Compte Rendu
          </Typography>
        </Box>
        <Box className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-1">Nom du patient</h3>
              <p className="text-base border-b pb-1">
                {`${patient.nom} ${patient.prenom}`}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Date</h3>
              <p className="text-base border-b pb-1">{data.date}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Rapport médical</h3>
            <div
              className="mt-2 p-4 border rounded-md bg-gray-50 min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: data.note }}
            />
          </div>

          <div className="flex justify-end no-print">
            <Button
              variant="contained"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => print()}
            >
              Imprimer
            </Button>
          </div>
        </Box>
        <Box className="text-sm text-muted-foreground">
          Toutes les informations relatives aux patients sont confidentielles et
          protégées par les lois sur la protection de la vie privée.
        </Box>
      </Box>
      <Printable
        title={"Compte rendu"}
        content={data.note}
        name={`${patient?.nom} ${patient?.prenom}`}
      />
    </Paper>
  );
};

export default CompteRenduPageView;
