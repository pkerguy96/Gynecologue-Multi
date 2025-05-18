import { Modal } from "@mui/material";
import moment from "moment";
import getGlobalById from "../hooks/getGlobalById";
import { CACHE_KEY_OpDetails } from "../constants";
import { OperationSpecificDetails } from "../services/OperationService";
import LoadingSpinner from "./LoadingSpinner";

const OperationDetailsComponent = ({ onClose, open, operation }) => {
  const { data, isLoading } = getGlobalById(
    {} as any,
    CACHE_KEY_OpDetails,
    OperationSpecificDetails,
    undefined,
    operation
  );

  const xrayNote = data?.xray?.[0]?.note ?? "Aucune note";

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className="flex justify-center items-center"
      disableAutoFocus
    >
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg max-h-[calc(100%-2rem)] min-w-[60%] overflow-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6">Résumé de l'opération</h1>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p>
                  <strong>Nom du patient:</strong>{" "}
                  {data?.patient?.nom
                    ? `${data.patient.nom} ${data.patient.prenom ?? ""}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Cin du patient:</strong> {data?.patient?.cin ?? "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Date d'opération:</strong>{" "}
                  {data?.created_at
                    ? moment(data.created_at).format("YYYY-MM-DD")
                    : "N/A"}
                </p>
                <p>
                  <strong>Prix total:</strong> {data?.total_cost ?? "0"} MAD
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Radiographie</h2>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Radiographie</th>
                  <th className="p-2 text-left">Note</th>

                  <th className="p-2 text-left">Prix</th>
                </tr>
              </thead>
              <tbody>
                {data?.xray?.length > 0 ? (
                  data.xray.map((radio, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{radio?.xray_name ?? "N/A"}</td>
                      <td className="p-2">{radio?.note ?? "N/A"}</td>

                      <td className="p-2">{radio?.price ?? "0"} MAD</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2 text-center" colSpan={4}>
                      Aucune radiographie disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="w-10/12 h-px bg-gray-400 mx-auto my-6"></div>

            <h2 className="text-2xl font-semibold mb-4">Analyses</h2>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Analyse</th>
                  <th className="p-2 text-left">Délai</th>
                  <th className="p-2 text-left">Prix</th>
                </tr>
              </thead>
              <tbody>
                {data?.blood_type?.length > 0 ? (
                  data.blood_type
                    .flatMap((bloodType) => {
                      const codes = bloodType?.code?.split("|") ?? [];
                      const analyses = bloodType?.title?.split("|") ?? [];
                      const prices = bloodType?.price?.split("|") ?? [];
                      const delais = bloodType?.delai?.split("|") ?? [];

                      return codes.map((code, index) => ({
                        code: code || "N/A",
                        title: analyses[index] || "N/A",
                        delai: delais[index] || "N/A",
                        price: prices[index] ? `${prices[index]} MAD` : "N/A",
                      }));
                    })
                    .map((blood, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{blood.code}</td>
                        <td className="p-2">{blood.title}</td>
                        <td className="p-2">{blood.delai}</td>
                        <td className="p-2">{blood.price} </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td className="p-2 text-center" colSpan={4}>
                      Aucune analyse disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="w-10/12 h-px bg-gray-400 mx-auto my-6"></div>

            <h2 className="text-2xl font-semibold mb-4">Ordonance</h2>
            <ul className="list-disc pl-6 mb-6">
              {data?.ordonance?.[0]?.ordonance_details?.length > 0 ? (
                data.ordonance[0].ordonance_details.map(
                  (prescription, index) => (
                    <li key={index} className="mb-2">
                      <strong>{prescription?.medicine_name ?? "N/A"}</strong>:{" "}
                      {prescription?.note ?? "N/A"}
                    </li>
                  )
                )
              ) : (
                <li className="mb-2">Aucune ordonnance disponible</li>
              )}
            </ul>

            <div className="w-10/12 h-px bg-gray-400 mx-auto my-6"></div>
            <h2 className="text-2xl font-semibold mb-4">Compte Rendu</h2>
            {data?.operation_note?.note ? (
              <p
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: data.operation_note.note }}
              />
            ) : (
              <p className="whitespace-pre-wrap">Aucune note</p>
            )}

            <div className="w-10/12 h-px bg-gray-400 mx-auto my-6"></div>

            <h2 className="text-2xl font-semibold mb-4">
              Frais supplémentaires
            </h2>
            <ul className="list-disc pl-6 mb-6">
              {data?.operationdetails?.length > 0 ? (
                data.operationdetails.map((prescription, index) => (
                  <li key={index} className="mb-2">
                    <strong>{prescription?.operation_name ?? "N/A"}</strong>:{" "}
                    {prescription?.price ?? "0"} MAD
                  </li>
                ))
              ) : (
                <li className="mb-2">Aucun frais supplémentaire</li>
              )}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
};

export default OperationDetailsComponent;
