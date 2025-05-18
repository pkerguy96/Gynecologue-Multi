import { Box, Button } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { useParams } from "react-router";
import getGlobalById from "../hooks/getGlobalById";
import LoadingSpinner from "./LoadingSpinner";
import { CACHE_KEY_Bloodtest } from "../constants";
import { bloodTestApiClient } from "../services/BloodTest";
import usePrint from "../pages/PrintGlobal";

const BloodTestPrintableComponent = () => {
  const { id } = useParams();
  if (!id) {
    return <div>No ID specified.</div>;
  }

  const { print, Printable } = usePrint();

  const { data, isLoading } = getGlobalById(
    {} as any,
    [CACHE_KEY_Bloodtest[0], id],
    bloodTestApiClient,
    undefined,
    parseInt(id)
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="w-full flex flex-col gap-4 bg-white rounded-sm p-4 relative z-[1]">
        <div className="w-2/3 mx-auto flex flex-col gap-6">
          <div className="w-full flex gap-4 items-center flex-col">
            <p className="font-semibold">
              Fait a beni mellal Le {data?.created_at}
            </p>
            <p className="font-semibold">Nom & Prenom: {data?.patient_name}</p>
          </div>
          <div className="w-full flex flex-col gap-4 my-10">
            <div className="w-full flex flex-col gap-2">
              {Array.isArray(data?.blood_tests) &&
              data.blood_tests.length > 0 ? (
                data.blood_tests.map((test: any, index: number) => (
                  <div key={index}>
                    <h3 className="font-bold">
                      {index + 1} - {test.title}
                    </h3>
                  </div>
                ))
              ) : (
                <p className="italic text-gray-500">
                  No blood tests available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Printable
        name={data?.patient_name}
        date={data?.created_at}
        items={data.blood_tests}
        render={(item, index) => (
          <div key={index}>
            <h3 className="font-bold">
              {index + 1} - {item.title}
            </h3>
          </div>
        )}
      />

      <Box className="flex flex-col gap-4 sm:flex-row justify-end  mt-2 w-full ">
        <Button
          className="mt-4"
          variant="contained"
          size="large"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={() => print()}
        >
          Print
        </Button>
      </Box>
    </>
  );
};
export default BloodTestPrintableComponent;
